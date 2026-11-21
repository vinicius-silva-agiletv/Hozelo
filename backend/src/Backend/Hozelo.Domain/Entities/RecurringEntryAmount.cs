namespace Hozelo.Domain.Entities;

/// <summary>Valor da recorrência a partir de um mês (data-model.md, RecurringEntryAmount).</summary>
public class RecurringEntryAmount
{
    public long Id { get; set; }

    public long RecurringEntryId { get; set; }

    /// <summary>Primeiro dia do mês a partir do qual o valor vale.</summary>
    public DateOnly EffectiveMonth { get; set; }

    public decimal Amount { get; set; }
}
