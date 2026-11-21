using Hozelo.Communication.Responses;
using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Recurrence;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Recurrence;

/// <summary>Carrega a recorrência rastreada, aplica uma alteração, grava e devolve o detalhe atualizado.</summary>
public abstract class RecurrenceUseCaseBase(
    ILoggedUser loggedUser,
    IRecurrenceUpdateOnlyRepository updateOnlyRepository,
    IRecurrenceReadOnlyRepository readOnlyRepository,
    IUnitOfWork unitOfWork,
    ICalendar calendar)
{
    protected ICalendar Calendar { get; } = calendar;

    protected async Task<ResponseRecurrenceJson> Change(long id, Action<RecurringEntry> change)
    {
        var user = await loggedUser.User();

        var entry = await updateOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.RECURRENCE_NOT_FOUND);

        change(entry);

        await unitOfWork.Commit();

        var saved = await readOnlyRepository.GetById(user.Id, id);
        return RecurrenceMapper.ToResponse(saved!, Calendar.Today());
    }

    protected static void Fail(string message) => throw new ErrorOnValidationException([message]);

    /// <summary>Valida ano/mês de rota (2000–2100, 1–12) e devolve o primeiro dia.</summary>
    protected static DateOnly RouteMonth(int year, int month)
    {
        if (month is < 1 or > 12 || year is < 2000 or > 2100)
            Fail(ResourceMessagesException.MONTH_INVALID);

        return new DateOnly(year, month, 1);
    }
}
