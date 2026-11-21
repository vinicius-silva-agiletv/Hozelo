using Hozelo.Domain.Enums;

namespace Hozelo.Domain.Calculations;

public sealed record MonthTotals(decimal ForecastIncomes, decimal ForecastExpenses, decimal Received, decimal Paid)
{
    public decimal ForecastBalance => ForecastIncomes - ForecastExpenses;

    public decimal RealizedBalance => Received - Paid;
}

public sealed record OpeningPoint(decimal Amount, DateOnly ReferenceDate)
{
    public DateOnly Month => YearMonth.FirstDay(ReferenceDate);
}

public sealed record AccumulatedBalance(decimal PreviousBalance, decimal EndBalance);

/// <summary>Saldo do mês, pendências e saldo acumulado (research.md §8). Funções puras.</summary>
public static class BalanceCalculator
{
    public static MonthTotals Totals(IEnumerable<LedgerEntry> entries)
    {
        var list = entries.ToList();

        return new MonthTotals(
            ForecastIncomes: Sum(list.Where(e => e.Direction == EntryKind.Income), e => e.Amount),
            ForecastExpenses: Sum(list.Where(e => e.Direction == EntryKind.Expense), e => e.Amount),
            Received: Sum(list.Where(e => e.Direction == EntryKind.Income && e.IsSettled), e => e.SettledAmount),
            Paid: Sum(list.Where(e => e.Direction == EntryKind.Expense && e.IsSettled), e => e.SettledAmount));
    }

    /// <summary>Itens não liquidados de meses encerrados, a partir do saldo inicial.</summary>
    public static IReadOnlyList<LedgerEntry> Pending(IEnumerable<LedgerEntry> entries, OpeningPoint opening, DateOnly currentMonth) =>
        entries.Where(e => Counts(e, opening) && e.Month < currentMonth && !e.IsSettled && !e.PendingExempt)
            .OrderBy(e => e.Date).ThenBy(e => e.Name)
            .ToList();

    /// <summary>
    /// Saldo anterior e acumulado ao fim de <paramref name="targetMonth"/>: meses encerrados contam o realizado,
    /// o mês atual e os futuros contam o previsto, e as pendências (mais <paramref name="extraPending"/>, ex.: saldo das
    /// pessoas) entram no mês atual. Null antes do saldo inicial.
    /// </summary>
    public static AccumulatedBalance? Accumulated(
        IEnumerable<LedgerEntry> entries, OpeningPoint opening, DateOnly currentMonth, DateOnly targetMonth, decimal extraPending = 0m)
    {
        targetMonth = YearMonth.FirstDay(targetMonth);
        currentMonth = YearMonth.FirstDay(currentMonth);

        if (targetMonth < opening.Month)
            return null;

        var counted = entries.Where(e => Counts(e, opening)).ToList();
        var byMonth = counted.GroupBy(e => e.Month).ToDictionary(g => g.Key, g => Totals(g));

        var pending = Pending(counted, opening, currentMonth);
        var pendingBalance = Sum(pending.Where(e => e.Direction == EntryKind.Income), e => e.Amount)
            - Sum(pending.Where(e => e.Direction == EntryKind.Expense), e => e.Amount)
            + extraPending;

        var running = opening.Amount;
        var previous = running;

        for (var month = opening.Month; month <= targetMonth; month = month.AddMonths(1))
        {
            previous = running;

            if (byMonth.TryGetValue(month, out var totals))
                running += month < currentMonth ? totals.RealizedBalance : totals.ForecastBalance;

            if (month == currentMonth)
                running += pendingBalance;
        }

        return new AccumulatedBalance(previous, running);
    }

    /// <summary>Entra no acumulado: a partir da data de referência do saldo inicial.</summary>
    private static bool Counts(LedgerEntry entry, OpeningPoint opening) =>
        entry.Month >= opening.Month && entry.Date >= opening.ReferenceDate;

    // Soma começando de 0.00m para manter 2 casas decimais na resposta.
    private static decimal Sum(IEnumerable<LedgerEntry> entries, Func<LedgerEntry, decimal> selector) =>
        entries.Aggregate(0.00m, (total, e) => total + selector(e));
}
