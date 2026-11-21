namespace Hozelo.Communication.Requests;

/// <summary>Dados que valem para todos os meses da recorrência.</summary>
public class RequestUpdateRecurrenceJson
{
    public string Name { get; set; } = string.Empty;

    public long CategoryId { get; set; }

    public int DayOfMonth { get; set; }

    public string? Notes { get; set; }
}
