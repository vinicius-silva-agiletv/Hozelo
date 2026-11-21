using Hozelo.Communication.Enums;

namespace Hozelo.Communication.Responses;

public class ResponseShortExpenseJson
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public ResponseCategorySummaryJson Category { get; set; } = new();

    public AmountType AmountType { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal InstallmentAmount { get; set; }

    public bool IsInstallment { get; set; }

    public int InstallmentsCount { get; set; }

    public int PaidInstallments { get; set; }

    public int RemainingInstallments { get; set; }

    public DateOnly FirstDueDate { get; set; }

    public DateOnly LastDueDate { get; set; }

    public DateOnly? NextDueDate { get; set; }

    public decimal PaidAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal RemainingAmount { get; set; }

    public ExpenseStatus Status { get; set; }

    public string? Notes { get; set; }

    public ResponsePersonSummaryJson? Person { get; set; }

    public int? PersonPercent { get; set; }
}
