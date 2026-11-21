using Hozelo.Communication.Enums;

namespace Hozelo.Communication.Requests;

public class RequestUpdateExpenseJson
{
    public string Name { get; set; } = string.Empty;

    public long CategoryId { get; set; }

    public AmountType? AmountType { get; set; }

    public decimal Amount { get; set; }

    public bool IsInstallment { get; set; }

    public int InstallmentsCount { get; set; } = 1;

    public DateOnly? FirstDueDate { get; set; }

    public string? Notes { get; set; }
}
