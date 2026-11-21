using Hozelo.Domain.Enums;

namespace Hozelo.Domain.Entities;

/// <summary>
/// Receita recorrente (salário) ou conta fixa (internet, luz): uma regra que gera uma ocorrência por mês
/// (data-model.md, RecurringEntry; research.md §3–§5). As ocorrências não são gravadas.
/// </summary>
public class RecurringEntry : EntityBase
{
    public long UserId { get; set; }

    public long CategoryId { get; set; }

    public Category Category { get; set; } = null!;

    public EntryKind Kind { get; set; }

    public string Name { get; set; } = string.Empty;

    public int DayOfMonth { get; set; }

    /// <summary>Primeiro dia do mês inicial.</summary>
    public DateOnly StartMonth { get; set; }

    /// <summary>Primeiro dia do último mês; null = sem fim.</summary>
    public DateOnly? EndMonth { get; set; }

    public string? Notes { get; set; }

    public IList<RecurringEntryAmount> Amounts { get; set; } = [];

    public IList<RecurringEntryMonth> Months { get; set; } = [];

    public bool IsWithinPeriod(DateOnly month) => month >= StartMonth && (EndMonth is null || month <= EndMonth);

    /// <summary>Valor da regra no mês: o do histórico com o maior mês de início que não passa do mês.</summary>
    public decimal RuleAmount(DateOnly month)
    {
        var ordered = Amounts.OrderBy(a => a.EffectiveMonth).ToList();
        return ordered.LastOrDefault(a => a.EffectiveMonth <= month)?.Amount ?? ordered[0].Amount;
    }

    public RecurringEntryMonth? MonthRecord(DateOnly month) => Months.FirstOrDefault(m => m.Month == month);

    /// <summary>
    /// Novo valor a partir de <paramref name="month"/>, mantendo as mudanças posteriores. Meses já confirmados
    /// sem ajuste são congelados com o valor antigo, para que nada recebido/pago mude (research.md §5).
    /// </summary>
    public void ChangeAmountFrom(DateOnly month, decimal amount)
    {
        foreach (var record in Months.Where(m => m.Month >= month && m.SettledOn is not null && m.Amount is null))
            record.Amount = RuleAmount(record.Month);

        var existing = Amounts.FirstOrDefault(a => a.EffectiveMonth == month);
        if (existing is not null)
            existing.Amount = amount;
        else
            Amounts.Add(new RecurringEntryAmount { EffectiveMonth = month, Amount = amount });
    }

    public void AdjustMonth(DateOnly month, decimal amount)
    {
        var record = GetOrCreate(month);
        record.Amount = amount;
        record.Skipped = false;
    }

    public void SkipMonth(DateOnly month)
    {
        var record = GetOrCreate(month);
        record.Amount = null;
        record.Skipped = true;
    }

    /// <summary>Desfaz ajuste ou pulo, mantendo a confirmação do mês.</summary>
    public void UndoMonthAdjustment(DateOnly month)
    {
        var record = MonthRecord(month);
        if (record is null)
            return;

        record.Amount = null;
        record.Skipped = false;
        RemoveIfEmpty(record);
    }

    /// <summary>Confirma o mês (idempotente: mantém a primeira data).</summary>
    public void SettleMonth(DateOnly month, DateOnly settledOn)
    {
        var record = GetOrCreate(month);
        record.SettledOn ??= settledOn;
    }

    public void UndoMonthSettlement(DateOnly month)
    {
        var record = MonthRecord(month);
        if (record is null)
            return;

        record.SettledOn = null;
        RemoveIfEmpty(record);
    }

    public void End(DateOnly lastMonth) => EndMonth = lastMonth;

    public void Reopen() => EndMonth = null;

    private RecurringEntryMonth GetOrCreate(DateOnly month)
    {
        var record = MonthRecord(month);
        if (record is not null)
            return record;

        record = new RecurringEntryMonth { Month = month };
        Months.Add(record);
        return record;
    }

    private void RemoveIfEmpty(RecurringEntryMonth record)
    {
        if (record.IsEmpty)
            Months.Remove(record);
    }
}
