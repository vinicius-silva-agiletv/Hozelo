namespace Hozelo.Domain.Entities;

/// <summary>Cobrança avulsa de uma pessoa (data-model.md, PersonCharge).</summary>
public class PersonCharge : EntityBase
{
    public long UserId { get; set; }

    public long PersonId { get; set; }

    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateOnly ChargeDate { get; set; }

    public string? Notes { get; set; }
}
