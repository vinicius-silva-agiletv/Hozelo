using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Calculations;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Person;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Person;

public sealed class PersonUseCase(
    ILoggedUser loggedUser,
    IPersonReadOnlyRepository readOnlyRepository,
    IPersonWriteOnlyRepository writeOnlyRepository,
    IPersonUpdateOnlyRepository updateOnlyRepository,
    IPersonLedgerLoader ledgerLoader,
    IUnitOfWork unitOfWork,
    ICalendar calendar,
    TimeProvider timeProvider) : IPersonUseCase
{
    public async Task<ResponsePeopleJson> GetAll()
    {
        var user = await loggedUser.User();
        var today = calendar.Today();
        var currentMonth = YearMonth.FirstDay(today);

        var people = await readOnlyRepository.GetAll(user.Id);
        var ledgers = await ledgerLoader.Load(user.Id, null, currentMonth.AddMonths(1));

        return new ResponsePeopleJson
        {
            People = people.Select(p =>
            {
                var ledger = ledgers.GetValueOrDefault(p.Id) ?? PersonLedger.Empty;
                return new ResponsePersonJson
                {
                    Id = p.Id,
                    Name = p.Name,
                    BalanceUntilNow = PersonStatementCalculator.OwedUntilNow(ledger.Charges, ledger.Payments, today),
                    CurrentMonthDue = PersonStatementCalculator.Month(ledger.Charges.ToList(), ledger.Payments.ToList(), currentMonth).EndBalance
                };
            }).ToList()
        };
    }

    public async Task<ResponsePersonJson> Register(RequestPersonJson request)
    {
        var user = await loggedUser.User();

        Validate(request);

        if (await readOnlyRepository.ExistsWithName(user.Id, request.Name))
            throw new ConflictException(ResourceMessagesException.PERSON_NAME_ALREADY_EXISTS);

        var person = new Domain.Entities.Person { UserId = user.Id, Name = request.Name, CreatedOn = timeProvider.GetUtcNow().UtcDateTime };

        await writeOnlyRepository.Add(person);
        await unitOfWork.Commit();

        return new ResponsePersonJson { Id = person.Id, Name = person.Name, BalanceUntilNow = 0.00m, CurrentMonthDue = 0.00m };
    }

    public async Task Update(long id, RequestPersonJson request)
    {
        var user = await loggedUser.User();

        var person = await updateOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.PERSON_NOT_FOUND);

        Validate(request);

        if (await readOnlyRepository.ExistsWithName(user.Id, request.Name, excludingId: id))
            throw new ConflictException(ResourceMessagesException.PERSON_NAME_ALREADY_EXISTS);

        person.Name = request.Name;
        await unitOfWork.Commit();
    }

    public async Task Delete(long id)
    {
        var user = await loggedUser.User();

        var person = await updateOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.PERSON_NOT_FOUND);

        if (await readOnlyRepository.HasEntries(user.Id, id))
            throw new ConflictException(ResourceMessagesException.PERSON_HAS_ENTRIES);

        writeOnlyRepository.Delete(person);
        await unitOfWork.Commit();
    }

    private static void Validate(RequestPersonJson request)
    {
        request.Name = request.Name?.Trim() ?? string.Empty;
        ValidationErrors.ThrowIfAny(new PersonValidator().Validate(request).Messages());
    }
}
