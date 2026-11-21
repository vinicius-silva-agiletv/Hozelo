namespace Hozelo.Communication.Responses;

public class ResponseIncomeJson
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public ResponseCategorySummaryJson Category { get; set; } = new();

    public decimal Amount { get; set; }

    public DateOnly ExpectedDate { get; set; }

    public bool IsReceived { get; set; }

    public DateOnly? ReceivedOn { get; set; }

    public string? Notes { get; set; }
}
