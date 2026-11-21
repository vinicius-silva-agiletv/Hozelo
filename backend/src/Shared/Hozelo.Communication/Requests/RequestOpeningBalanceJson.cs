namespace Hozelo.Communication.Requests;

public class RequestOpeningBalanceJson
{
    /// <summary>Pode ser negativo.</summary>
    public decimal Amount { get; set; }

    public DateOnly? ReferenceDate { get; set; }
}
