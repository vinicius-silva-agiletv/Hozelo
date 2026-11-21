using Hozelo.Domain.Enums;

namespace Hozelo.Domain.Calculations;

/// <summary>
/// Lançamento neutro do resumo do mês (research.md §7): parcela, receita avulsa ou ocorrência de recorrência.
/// <see cref="Amount"/> é o valor previsto (para parcela paga, o valor efetivamente pago);
/// <see cref="SettledAmount"/> é o que de fato entrou/saiu.
/// </summary>
public sealed record LedgerEntry
{
    public required EntryKind Direction { get; init; }

    public required LedgerSource Source { get; init; }

    public required long SourceId { get; init; }

    public required string Name { get; init; }

    public required long CategoryId { get; init; }

    public required string CategoryName { get; init; }

    /// <summary>Primeiro dia do mês de referência.</summary>
    public required DateOnly Month { get; init; }

    public required DateOnly Date { get; init; }

    public required decimal Amount { get; init; }

    public DateOnly? SettledOn { get; init; }

    public decimal SettledAmount { get; init; }

    public int? Number { get; init; }

    public int? InstallmentsCount { get; init; }

    public bool PaidInAdvance { get; init; }

    /// <summary>Não vira pendência item a item (reembolsos: a pendência é o saldo da pessoa, research.md 004 §9).</summary>
    public bool PendingExempt { get; init; }

    public bool IsSettled => SettledOn.HasValue;
}
