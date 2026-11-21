using Hozelo.Application.UseCases.Category;
using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Domain.Repositories.Recurrence;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Recurrence.Update;

/// <summary>Nome, categoria, dia e observação valem para todos os meses.</summary>
public sealed class UpdateRecurrenceUseCase(
    ILoggedUser loggedUser,
    ICategoryReadOnlyRepository categoryRepository,
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
        ValidationErrors.ThrowIfAny(errors);

        entry.Name = request.Name;
        entry.CategoryId = request.CategoryId;
        entry.DayOfMonth = request.DayOfMonth;
        entry.Notes = request.Notes;

        await unitOfWork.Commit();

        return RecurrenceMapper.ToResponse((await readOnlyRepository.GetById(user.Id, id))!, calendar.Today());
    }
}
