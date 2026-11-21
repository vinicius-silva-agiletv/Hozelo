using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Recurrence.Months;

/// <summary>Ajustar/pular um mês, desfazer, confirmar recebimento/pagamento e desfazer.</summary>
public interface IRecurrenceMonthUseCase
{
    Task<ResponseRecurrenceJson> Adjust(long id, int year, int month, RequestAdjustRecurrenceMonthJson request);

    Task<ResponseRecurrenceJson> UndoAdjustment(long id, int year, int month);

    Task<ResponseRecurrenceJson> Settle(long id, int year, int month, RequestSettleRecurrenceMonthJson? request);

    Task<ResponseRecurrenceJson> UndoSettlement(long id, int year, int month);
}
