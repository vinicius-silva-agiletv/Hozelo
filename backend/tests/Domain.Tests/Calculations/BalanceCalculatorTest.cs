using Hozelo.Domain.Calculations;
using Hozelo.Domain.Enums;
using Shouldly;

namespace Domain.Tests.Calculations;

public class BalanceCalculatorTest
{
    private static readonly DateOnly Oct = new(2026, 10, 1);
    private static readonly DateOnly Nov = new(2026, 11, 1);
    private static readonly DateOnly Dec = new(2026, 12, 1);
    private static readonly DateOnly Jan = new(2027, 1, 1);

    private static LedgerEntry Entry(EntryKind direction, DateOnly date, decimal amount, DateOnly? settledOn = null, string name = "x") => new()
    {
        Direction = direction,
        Source = LedgerSource.Recurrence,
        SourceId = 1,
        Name = name,
        CategoryId = 1,
        CategoryName = "c",
        Month = YearMonth.FirstDay(date),
        Date = date,
        Amount = amount,
        SettledOn = settledOn,
        SettledAmount = settledOn.HasValue ? amount : 0m
    };

    private static LedgerEntry In(DateOnly date, decimal amount, bool settled = false) =>
        Entry(EntryKind.Income, date, amount, settled ? date : null);

    private static LedgerEntry Out(DateOnly date, decimal amount, bool settled = false, string name = "x") =>
        Entry(EntryKind.Expense, date, amount, settled ? date : null, name);

    [Fact]
    public void Totals_Forecast_And_Realized()
    {
        var totals = BalanceCalculator.Totals(
        [
            In(Nov.AddDays(4), 6000m, settled: true), In(Nov.AddDays(29), 2500m),
            Out(Nov.AddDays(9), 4870m, settled: true), Out(Nov.AddDays(14), 1250m)
        ]);

        totals.ForecastIncomes.ShouldBe(8500m);
        totals.ForecastExpenses.ShouldBe(6120m);
        totals.ForecastBalance.ShouldBe(2380m);
        totals.Received.ShouldBe(6000m);
        totals.Paid.ShouldBe(4870m);
        totals.RealizedBalance.ShouldBe(1130m);
    }

    [Fact]
    public void Negative_Balance_And_Empty_Month()
    {
        BalanceCalculator.Totals([In(Nov, 100m), Out(Nov, 300m)]).ForecastBalance.ShouldBe(-200m);
        BalanceCalculator.Totals([]).ForecastBalance.ShouldBe(0m);
    }

    [Fact]
    public void Past_Months_Realized_Current_And_Future_Forecast()
    {
        var opening = new OpeningPoint(3200m, Oct);
        LedgerEntry[] entries =
        [
            In(Oct.AddDays(4), 6000m, settled: true), Out(Oct.AddDays(9), 7000m, settled: true),
            Out(Oct.AddDays(20), 500m, settled: true),
            In(Nov.AddDays(4), 6000m), Out(Nov.AddDays(9), 1000m),
            In(Dec.AddDays(4), 6000m), Out(Dec.AddDays(9), 7500m)
        ];

        // Outubro (encerrado) = realizado: 6000 - 7500 = -1500.
        BalanceCalculator.Accumulated(entries, opening, Nov, Oct).ShouldBe(new AccumulatedBalance(3200m, 1700m));
        // Novembro (atual) = previsto: +5000.
        BalanceCalculator.Accumulated(entries, opening, Nov, Nov).ShouldBe(new AccumulatedBalance(1700m, 6700m));
        // Dezembro (futuro) = previsto: -1500.
        BalanceCalculator.Accumulated(entries, opening, Nov, Dec).ShouldBe(new AccumulatedBalance(6700m, 5200m));
        // Janeiro sem lançamentos mantém o saldo.
        BalanceCalculator.Accumulated(entries, opening, Nov, Jan).ShouldBe(new AccumulatedBalance(5200m, 5200m));
    }

    [Fact]
    public void Previous_Balance_Always_Equals_Previous_End()
    {
        var random = new Random(3);
        var opening = new OpeningPoint(1000m, new DateOnly(2025, 3, 15));
        var current = new DateOnly(2026, 6, 1);
        var entries = Enumerable.Range(0, 300).Select(_ =>
        {
            var date = new DateOnly(2025, 1, 1).AddDays(random.Next(0, 900));
            var amount = random.Next(1, 100000) / 100m;
            var settled = random.Next(2) == 0;
            return random.Next(2) == 0 ? In(date, amount, settled) : Out(date, amount, settled);
        }).ToList();

        AccumulatedBalance? last = null;
        for (var month = opening.Month; month <= new DateOnly(2027, 6, 1); month = month.AddMonths(1))
        {
            var result = BalanceCalculator.Accumulated(entries, opening, current, month)!;
            if (last is not null)
                result.PreviousBalance.ShouldBe(last.EndBalance);
            last = result;
        }
    }

    [Fact]
    public void Pending_Enter_The_Current_Month_And_Settling_Keeps_The_End_Balance()
    {
        var opening = new OpeningPoint(0m, Oct);
        var internet = Out(Oct.AddDays(14), 120m, name: "Internet");
        var bonus = In(Oct.AddDays(9), 500m);
        LedgerEntry[] entries = [internet, bonus, In(Nov.AddDays(4), 6000m)];

        var pending = BalanceCalculator.Pending(entries, opening, Nov);
        pending.Count.ShouldBe(2);
        var before = BalanceCalculator.Accumulated(entries, opening, Nov, Nov)!;
        before.ShouldBe(new AccumulatedBalance(0m, 6380m));

        LedgerEntry[] afterPaying = [internet with { SettledOn = Nov.AddDays(2), SettledAmount = 120m }, bonus, In(Nov.AddDays(4), 6000m)];
        BalanceCalculator.Pending(afterPaying, opening, Nov).Count.ShouldBe(1);
        BalanceCalculator.Accumulated(afterPaying, opening, Nov, Nov)!.EndBalance.ShouldBe(6380m);
    }

    [Fact]
    public void Pending_Do_Not_Repeat_In_Future_Months_Or_Count_In_Past_Months()
    {
        var opening = new OpeningPoint(0m, Oct);
        LedgerEntry[] entries = [Out(Oct.AddDays(14), 120m)];

        BalanceCalculator.Accumulated(entries, opening, Nov, Oct)!.EndBalance.ShouldBe(0m);
        BalanceCalculator.Accumulated(entries, opening, Nov, Nov)!.EndBalance.ShouldBe(-120m);
        BalanceCalculator.Accumulated(entries, opening, Nov, Dec)!.ShouldBe(new AccumulatedBalance(-120m, -120m));
    }

    [Fact]
    public void Opening_Month_Counts_Only_From_Reference_Date_And_Earlier_Months_Have_No_Accumulated()
    {
        var opening = new OpeningPoint(1000m, Nov.AddDays(14));
        LedgerEntry[] entries = [In(Nov.AddDays(4), 6000m), Out(Nov.AddDays(19), 200m), Out(Oct.AddDays(1), 50m)];

        BalanceCalculator.Accumulated(entries, opening, Nov, Nov).ShouldBe(new AccumulatedBalance(1000m, 800m));
        BalanceCalculator.Accumulated(entries, opening, Nov, Oct).ShouldBeNull();
        BalanceCalculator.Pending(entries, opening, Dec).Count.ShouldBe(1);
    }
}
