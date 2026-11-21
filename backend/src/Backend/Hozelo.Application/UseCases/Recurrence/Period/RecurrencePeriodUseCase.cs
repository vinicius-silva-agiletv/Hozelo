using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Calculations;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Recurrence;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.Recurrence.Period;

public sealed class RecurrencePeriodUseCase(
    ILoggedUser loggedUser,
    IRecurrenceUpdateOnlyRepository updateOnlyRepository,
    IRecurrenceReadOnlyRepository readOnlyRepository,
    IUnitOfWork unitOfWork,
    ICalendar calendar)
    : RecurrenceUseCaseBase(loggedUser, updateOnlyRepository, readOnlyRepository, unitOfWork, calendar), IRecurrencePeriodUseCase
{
    public Task<ResponseRecurrenceJson> ChangeAmount(long id, RequestChangeRecurrenceAmountJson request)
    {
        ValidationErrors.ThrowIfAny(new ChangeRecurrenceAmountValidator().Validate(request).Messages());
        var month = YearMonth.Parse(request.FromMonth);

        return Change(id, entry =>
        {
            if (!entry.IsWithinPeriod(month))
                Fail(ResourceMessagesException.MONTH_OUT_OF_PERIOD);

            entry.ChangeAmountFrom(month, request.Amount);
        });
    }

    public Task<ResponseRecurrenceJson> End(long id, RequestEndRecurrenceJson request)
    {
        if (!YearMonth.TryParse(request.EndMonth, out var endMonth))
            Fail(ResourceMessagesException.MONTH_FORMAT_INVALID);

        return Change(id, entry =>
        {
            if (endMonth < entry.StartMonth)
                Fail(ResourceMessagesException.END_BEFORE_START);

            if (entry.Months.Any(m => m.SettledOn is not null && m.Month > endMonth))
                Fail(ResourceMessagesException.SETTLED_AFTER_END);

            entry.End(endMonth);
        });
    }

    public Task<ResponseRecurrenceJson> Reopen(long id) => Change(id, entry => entry.Reopen());
}
