using Hozelo.Communication.Enums;

namespace Hozelo.Communication.Requests;

public class RequestRecurrenceJson : RequestUpdateRecurrenceJson
{
    public EntryKind? Kind { get; set; }

    public decimal Amount { get; set; }

    /// <summary>"yyyy-MM".</summary>
    public string StartMonth { get; set; } = string.Empty;

    /// <summary>"yyyy-MM" ou null (sem fim).</summary>
    public string? EndMonth { get; set; }
}
