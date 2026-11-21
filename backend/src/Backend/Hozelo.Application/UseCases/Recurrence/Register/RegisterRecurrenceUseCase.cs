using Hozelo.Application.UseCases.Category;
using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Calculations;
using Hozelo.Domain.Entities;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Domain.Repositories.Recurrence;
using Hozelo.Domain.Repositories.Person;
using Hozelo.Application.UseCases.Person;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;

namespace Hozelo.Application.UseCases.Recurrence.Register;

public sealed class RegisterRecurrenceUseCase(
    ILoggedUser loggedUser,
    ICategoryReadOnlyRepository categoryRepository,
    IPersonReadOnlyRepository personRepository,
    IRecurrenceWriteOnlyRepository writeOnlyRepository,
    IUnitOfWork unitOfWork,
    ICalendar calendar,
    TimeProvider timeProvider) : IRegisterRecurrenceUseCase
{
    public async Task<ResponseRecurrenceJson> Execute(RequestRecurrenceJson request)
    {
        var user = await loggedUser.User();

        UpdateRecurrenceValidator.Normalize(request);
        var errors = new RecurrenceValidator().Validate(request).Messages();

        Domain.Entities.Category? category = null;
        if (request.Kind.HasValue && Enum.IsDefined(request.Kind.Value))
            category = await CategoryChecker.Check(categoryRepository, user.Id, request.CategoryId, (CategoryType)(int)request.Kind.Value, errors);

        var person = await PersonChecker.Check(personRepository, user.Id, request.PersonId, errors);

        ValidationErrors.ThrowIfAny(errors);

        var startMonth = YearMonth.Parse(request.StartMonth);
        var entry = new RecurringEntry
        {
            UserId = user.Id,
            CategoryId = category!.Id,
            Kind = (EntryKind)(int)request.Kind!.Value,
            Name = request.Name,
            DayOfMonth = request.DayOfMonth,
            StartMonth = startMonth,
            EndMonth = string.IsNullOrWhiteSpace(request.EndMonth) ? null : YearMonth.Parse(request.EndMonth),
            Notes = request.Notes,
            PersonId = request.PersonId,
            PersonPercent = PersonChecker.Percent(request.PersonId, request.PersonPercent),
            CreatedOn = timeProvider.GetUtcNow().UtcDateTime,
            Amounts = [new RecurringEntryAmount { EffectiveMonth = startMonth, Amount = request.Amount }]
        };

        await writeOnlyRepository.Add(entry);
        await unitOfWork.Commit();

        entry.Category = category;
        entry.Person = person;
        return RecurrenceMapper.ToResponse(entry, calendar.Today());
    }
}
