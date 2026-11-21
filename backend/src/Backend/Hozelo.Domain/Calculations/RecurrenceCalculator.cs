using Hozelo.Domain.Entities;

namespace Hozelo.Domain.Calculations;

/// <summary>Ocorrência de uma recorrência em um mês (calculada, não gravada).</summary>
public sealed record Occurrence(DateOnly Month, DateOnly Date, decimal Amount, bool IsAdjusted, DateOnly? SettledOn)
{
    public bool IsSettled => SettledOn.HasValue;
}

/// <summary>Regras de research.md §4.</summary>
public static class RecurrenceCalculator
{
    public static Occurrence? For(RecurringEntry entry, DateOnly month)
    {
        month = YearMonth.FirstDay(month);

        if (!entry.IsWithinPeriod(month))
            return null;

        var record = entry.MonthRecord(month);
        if (record?.Skipped == true)
            return null;

        var day = Math.Min(entry.DayOfMonth, DateTime.DaysInMonth(month.Year, month.Month));

        return new Occurrence(
            Month: month,
            Date: new DateOnly(month.Year, month.Month, day),
            Amount: record?.Amount ?? entry.RuleAmount(month),
            IsAdjusted: record?.Amount is not null,
            SettledOn: record?.SettledOn);
    }

    /// <summary>Ocorrências dos meses em [<paramref name="from"/>, <paramref name="to"/>).</summary>
    public static IEnumerable<Occurrence> Between(RecurringEntry entry, DateOnly from, DateOnly to)
    {
        var start = YearMonth.FirstDay(from) < entry.StartMonth ? entry.StartMonth : YearMonth.FirstDay(from);

        for (var month = start; month < to; month = month.AddMonths(1))
        {
            if (entry.EndMonth.HasValue && month > entry.EndMonth.Value)
                yield break;

            var occurrence = For(entry, month);
            if (occurrence is not null)
                yield return occurrence;
        }
    }
}
