namespace Hozelo.Communication.Requests;

public class RequestPersonChargeJson
{
    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateOnly? ChargeDate { get; set; }

    public string? Notes { get; set; }
}

public class RequestPersonPaymentJson
{
    public decimal Amount { get; set; }

    public DateOnly? PaidOn { get; set; }

    public string? Notes { get; set; }

    /// <summary>Cobranças escolhidas que este pagamento quita primeiro (opcional).</summary>
    public IList<string>? ChargeKeys { get; set; }
}
