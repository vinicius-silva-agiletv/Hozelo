namespace Hozelo.Communication.Requests;

/// <summary>Dados que valem para todos os meses da recorrência.</summary>
public class RequestUpdateRecurrenceJson
{
    public string Name { get; set; } = string.Empty;

    public long CategoryId { get; set; }

    public int DayOfMonth { get; set; }

    public string? Notes { get; set; }

    /// <summary>Pessoa de quem é (feature 004); null = só da família.</summary>
    public long? PersonId { get; set; }

    /// <summary>Parte da pessoa (1–100); padrão 100 quando há pessoa.</summary>
    public int? PersonPercent { get; set; }
}
