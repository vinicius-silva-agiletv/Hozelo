namespace Hozelo.Domain.Entities;

/// <summary>Exceção ou confirmação de um mês da recorrência (data-model.md, RecurringEntryMonth).</summary>
public class RecurringEntryMonth
{
    public long Id { get; set; }

    public long RecurringEntryId { get; set; }

    /// <summary>Primeiro dia do mês.</summary>
    public DateOnly Month { get; set; }

    /// <summary>Valor ajustado só deste mês; null segue a regra.</summary>
    public decimal? Amount { get; set; }

    public bool Skipped { get; set; }

    /// <summary>Data em que foi recebida (receita) ou paga (conta fixa).</summary>
    public DateOnly? SettledOn { get; set; }

    public bool IsEmpty => Amount is null && !Skipped && SettledOn is null;
}
