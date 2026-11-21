namespace Hozelo.Communication.Responses;

public class ResponseMonthlyInstallmentJson
{
    public long ExpenseId { get; set; }

    public string ExpenseName { get; set; } = string.Empty;

    public ResponseCategorySummaryJson Category { get; set; } = new();

    public int Number { get; set; }

    public int InstallmentsCount { get; set; }

    public DateOnly DueDate { get; set; }

    public decimal Amount { get; set; }

    public bool IsPaid { get; set; }

    public DateOnly? PaidOn { get; set; }

    public decimal? PaidAmount { get; set; }

    public bool Prepaid { get; set; }

    /// <summary>Paga em mês anterior ao do vencimento: aparece no mês do pagamento.</summary>
    public bool PaidInAdvance { get; set; }
}
