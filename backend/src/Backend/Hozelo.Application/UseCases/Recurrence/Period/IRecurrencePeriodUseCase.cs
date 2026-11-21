using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Recurrence.Period;

/// <summary>Valor dali em diante, encerrar e reabrir.</summary>
public interface IRecurrencePeriodUseCase
{
    Task<ResponseRecurrenceJson> ChangeAmount(long id, RequestChangeRecurrenceAmountJson request);

    Task<ResponseRecurrenceJson> End(long id, RequestEndRecurrenceJson request);

    Task<ResponseRecurrenceJson> Reopen(long id);
}
