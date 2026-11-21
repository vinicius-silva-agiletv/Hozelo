namespace Hozelo.Domain.Entities;

/// <summary>Saldo inicial do acumulado (data-model.md, OpeningBalance); um por conta.</summary>
public class OpeningBalance
{
    public long Id { get; set; }

    public long UserId { get; set; }

    /// <summary>Pode ser negativo.</summary>
    public decimal Amount { get; set; }

    public DateOnly ReferenceDate { get; set; }

    public DateTime UpdatedOn { get; set; }
}
