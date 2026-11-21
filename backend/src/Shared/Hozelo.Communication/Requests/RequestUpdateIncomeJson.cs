namespace Hozelo.Communication.Requests;

public class RequestUpdateIncomeJson
{
    public string Name { get; set; } = string.Empty;

    public long CategoryId { get; set; }

    public decimal Amount { get; set; }

    public DateOnly? ExpectedDate { get; set; }

    public string? Notes { get; set; }
}
