namespace Hozelo.Communication.Requests;

public class RequestAdjustRecurrenceMonthJson
{
    /// <summary>Novo valor só deste mês.</summary>
    public decimal? Amount { get; set; }

    /// <summary>Não recebido / não cobrado neste mês.</summary>
    public bool Skipped { get; set; }
}
