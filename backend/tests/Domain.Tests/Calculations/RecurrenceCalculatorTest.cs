using CommonTestUtilities.Entities;
using Hozelo.Domain.Calculations;
using Shouldly;

namespace Domain.Tests.Calculations;

public class RecurrenceCalculatorTest
{
    private static readonly DateOnly Jan2026 = new(2026, 1, 1);

    [Fact]
    public void Generates_Every_Month_From_Start_Without_End()
    {
        var entry = RecurringEntryBuilder.Build();

        RecurrenceCalculator.For(entry, new DateOnly(2025, 12, 1)).ShouldBeNull();
        var may = RecurrenceCalculator.For(entry, new DateOnly(2030, 5, 20))!;
        may.Date.ShouldBe(new DateOnly(2030, 5, 5));
        may.Amount.ShouldBe(6000m);
        may.IsSettled.ShouldBeFalse();
    }

    [Fact]
    public void Stops_After_End_Month()
    {
        var entry = RecurringEntryBuilder.Build(endMonth: new DateOnly(2027, 6, 1));

        RecurrenceCalculator.For(entry, new DateOnly(2027, 6, 1)).ShouldNotBeNull();
        RecurrenceCalculator.For(entry, new DateOnly(2027, 7, 1)).ShouldBeNull();
        RecurrenceCalculator.Between(entry, Jan2026, new DateOnly(2030, 1, 1)).Count().ShouldBe(18);
    }

    [Fact]
    public void Day_31_Uses_Last_Day_Of_Month()
    {
        var entry = RecurringEntryBuilder.Build(day: 31);

        RecurrenceCalculator.For(entry, new DateOnly(2026, 2, 1))!.Date.ShouldBe(new DateOnly(2026, 2, 28));
        RecurrenceCalculator.For(entry, new DateOnly(2028, 2, 1))!.Date.ShouldBe(new DateOnly(2028, 2, 29));
        RecurrenceCalculator.For(entry, new DateOnly(2026, 4, 1))!.Date.ShouldBe(new DateOnly(2026, 4, 30));
    }

    [Fact]
    public void Amount_History_Each_Change_Until_The_Next()
    {
        var entry = RecurringEntryBuilder.Build();
        entry.ChangeAmountFrom(new DateOnly(2027, 3, 1), 6600m);
        entry.ChangeAmountFrom(new DateOnly(2028, 1, 1), 7000m);

        RecurrenceCalculator.For(entry, new DateOnly(2027, 2, 1))!.Amount.ShouldBe(6000m);
        RecurrenceCalculator.For(entry, new DateOnly(2027, 3, 1))!.Amount.ShouldBe(6600m);
        RecurrenceCalculator.For(entry, new DateOnly(2027, 12, 1))!.Amount.ShouldBe(6600m);
        RecurrenceCalculator.For(entry, new DateOnly(2028, 1, 1))!.Amount.ShouldBe(7000m);
    }

    [Fact]
    public void Adjustment_Prevails_And_Skip_Removes_The_Month()
    {
        var entry = RecurringEntryBuilder.Build();
        entry.AdjustMonth(new DateOnly(2026, 12, 1), 5400m);
        entry.SkipMonth(new DateOnly(2026, 10, 1));

        var december = RecurrenceCalculator.For(entry, new DateOnly(2026, 12, 1))!;
        december.Amount.ShouldBe(5400m);
        december.IsAdjusted.ShouldBeTrue();
        RecurrenceCalculator.For(entry, new DateOnly(2026, 10, 1)).ShouldBeNull();
        RecurrenceCalculator.For(entry, new DateOnly(2026, 11, 1))!.Amount.ShouldBe(6000m);
    }

    [Fact]
    public void Settlement_Is_Per_Month()
    {
        var entry = RecurringEntryBuilder.Build();
        entry.SettleMonth(new DateOnly(2026, 12, 1), new DateOnly(2026, 12, 5));

        RecurrenceCalculator.For(entry, new DateOnly(2026, 12, 1))!.SettledOn.ShouldBe(new DateOnly(2026, 12, 5));
        RecurrenceCalculator.For(entry, new DateOnly(2027, 1, 1))!.IsSettled.ShouldBeFalse();
    }

    [Fact]
    public void Between_Respects_Range_And_Start()
    {
        var entry = RecurringEntryBuilder.Build(startMonth: new DateOnly(2026, 6, 1));

        var months = RecurrenceCalculator.Between(entry, Jan2026, new DateOnly(2026, 9, 1)).Select(o => o.Month.Month);

        months.ShouldBe([6, 7, 8]);
    }
}
