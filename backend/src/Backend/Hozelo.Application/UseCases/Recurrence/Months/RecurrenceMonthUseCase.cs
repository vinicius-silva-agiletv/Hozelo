using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Recurrence;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.Recurrence.Months;

public sealed class RecurrenceMonthUseCase(
    ILoggedUser loggedUser,
    IRecurrenceUpdateOnlyRepository updateOnlyRepository,
    IRecurrenceReadOnlyRepository readOnlyRepository,
    IUnitOfWork unitOfWork,
    ICalendar calendar)
    : RecurrenceUseCaseBase(loggedUser, updateOnlyRepository, readOnlyRepository, unitOfWork, calendar), IRecurrenceMonthUseCase
{
    public Task<ResponseRecurrenceJson> Adjust(long id, int year, int month, RequestAdjustRecurrenceMonthJson request)
    {
        var target = RouteMonth(year, month);
        ValidationErrors.ThrowIfAny(new AdjustRecurrenceMonthValidator().Validate(request).Messages());

        return Change(id, entry =>
        {
            if (!entry.IsWithinPeriod(target))
                Fail(ResourceMessagesException.MONTH_OUT_OF_PERIOD);

            if (request.Skipped)
            {
                if (entry.MonthRecord(target)?.SettledOn is not null)
                    Fail(ResourceMessagesException.UNDO_SETTLEMENT_BEFORE_SKIP);

                entry.SkipMonth(target);
            }
            else
            {
                entry.AdjustMonth(target, request.Amount!.Value);
            }
        });
    }

    public Task<ResponseRecurrenceJson> UndoAdjustment(long id, int year, int month)
    {
        var target = RouteMonth(year, month);
        return Change(id, entry => entry.UndoMonthAdjustment(target));
    }

    public Task<ResponseRecurrenceJson> Settle(long id, int year, int month, RequestSettleRecurrenceMonthJson? request)
    {
        var target = RouteMonth(year, month);
        var today = Calendar.Today();
        var settledOn = request?.SettledOn ?? today;

        if (settledOn > today)
            Fail(ResourceMessagesException.DATE_IN_FUTURE);

        return Change(id, entry =>
        {
            if (!entry.IsWithinPeriod(target))
                Fail(ResourceMessagesException.MONTH_OUT_OF_PERIOD);

            if (entry.MonthRecord(target)?.Skipped == true)
                Fail(ResourceMessagesException.MONTH_SKIPPED);

            entry.SettleMonth(target, settledOn);
        });
    }

    public Task<ResponseRecurrenceJson> UndoSettlement(long id, int year, int month)
    {
        var target = RouteMonth(year, month);
        return Change(id, entry => entry.UndoMonthSettlement(target));
    }
}
