using Hozelo.Application.UseCases.Category;
using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Domain.Repositories.Recurrence;
using Hozelo.Domain.Repositories.Person;
using Hozelo.Application.UseCases.Person;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Recurrence.Update;

/// <summary>Nome, categoria, dia e observação valem para todos os meses.</summary>
public sealed class UpdateRecurrenceUseCase(
    ILoggedUser loggedUser,
    ICategoryReadOnlyRepository categoryRepository,
    IPersonReadOnlyRepository personRepository,
    IRecurrenceUpdateOnlyRepository updateOnlyRepository,
    IRecurrenceReadOnlyRepository readOnlyRepository,
    IUnitOfWork unitOfWork,
    ICalendar calendar) : IUpdateRecurrenceUseCase
{
    public async Task<ResponseRecurrenceJson> Execute(long id, RequestUpdateRecurrenceJson request)
    {
        var user = await loggedUser.User();

        var entry = await updateOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.RECURRENCE_NOT_FOUND);

        UpdateRecurrenceValidator.Normalize(request);
        var errors = new UpdateRecurrenceValidator().Validate(request).Messages();
        await CategoryChecker.Check(categoryRepository, user.Id, request.CategoryId, (CategoryType)(int)entry.Kind, errors);
        if (request.PersonId is not null && entry.Kind == EntryKind.Income)
            errors.Add(ResourceMessagesException.RECURRENCE_INCOME_CANNOT_BE_MARKED);
        else
            await PersonChecker.Check(personRepository, user.Id, request.PersonId, errors);
        ValidationErrors.ThrowIfAny(errors);

        entry.Name = request.Name;
        entry.CategoryId = request.CategoryId;
        entry.DayOfMonth = request.DayOfMonth;
        entry.Notes = request.Notes;
        entry.PersonId = request.PersonId;
        entry.PersonPercent = PersonChecker.Percent(request.PersonId, request.PersonPercent);

        await unitOfWork.Commit();

        return RecurrenceMapper.ToResponse((await readOnlyRepository.GetById(user.Id, id))!, calendar.Today());
    }
}
