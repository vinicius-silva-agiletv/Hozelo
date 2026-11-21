using Hozelo.Communication.Enums;

namespace Hozelo.Communication.Responses;

public class ResponseShortRecurrenceJson
{
    public long Id { get; set; }

    public EntryKind Kind { get; set; }

    public string Name { get; set; } = string.Empty;

    public ResponseCategorySummaryJson Category { get; set; } = new();

    public int DayOfMonth { get; set; }

    public string StartMonth { get; set; } = string.Empty;

    public string? EndMonth { get; set; }

    public bool IsActive { get; set; }

    public decimal CurrentAmount { get; set; }

    public string? Notes { get; set; }
}
