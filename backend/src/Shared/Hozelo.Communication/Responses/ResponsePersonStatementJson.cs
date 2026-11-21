using Hozelo.Communication.Enums;

namespace Hozelo.Communication.Responses;

public class ResponsePersonChargeJson
{
    public long Id { get; set; }

    public string Key { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateOnly ChargeDate { get; set; }

    public string? Notes { get; set; }
}

public class ResponsePersonPaymentJson
{
    public long Id { get; set; }

    public decimal Amount { get; set; }

    public DateOnly PaidOn { get; set; }

    public string? Notes { get; set; }

    public IList<string> ChargeKeys { get; set; } = [];
}

public class ResponsePersonChargeItemJson
{
    public string Key { get; set; } = string.Empty;

    public ChargeOriginType OriginType { get; set; }

    public long OriginId { get; set; }

    public string Description { get; set; } = string.Empty;

    public int? Number { get; set; }

    public int? Count { get; set; }

    public DateOnly Date { get; set; }

    public decimal Amount { get; set; }

    public decimal Paid { get; set; }

    public decimal Remaining { get; set; }

    public ChargeStatus Status { get; set; }
}

public class ResponsePersonStatementJson
{
    public ResponsePersonSummaryJson Person { get; set; } = new();

    public int Year { get; set; }

    public int Month { get; set; }

    public decimal PreviousBalance { get; set; }

    public IList<ResponsePersonChargeItemJson> Charges { get; set; } = [];

    public decimal TotalCharges { get; set; }

    public decimal TotalDue { get; set; }

    public IList<ResponsePersonPaymentJson> Payments { get; set; } = [];

    public decimal TotalPaid { get; set; }

    /// <summary>Negativo = crédito da pessoa.</summary>
    public decimal EndBalance { get; set; }
}

public class ResponsePersonOriginJson
{
    public ChargeOriginType OriginType { get; set; }

    public long OriginId { get; set; }

    public string Description { get; set; } = string.Empty;

    public int ChargesDue { get; set; }

    public int ChargesTotal { get; set; }

    public decimal? MonthlyAmount { get; set; }

    public decimal Total { get; set; }

    public decimal Paid { get; set; }

    public decimal Remaining { get; set; }

    public bool IsOpenEnded { get; set; }
}

public class ResponsePersonOverviewJson
{
    public ResponsePersonSummaryJson Person { get; set; } = new();

    public IList<ResponsePersonOriginJson> Origins { get; set; } = [];

    public decimal OwedUntilNow { get; set; }

    public decimal OwedTotal { get; set; }

    public decimal UnallocatedCredit { get; set; }
}
