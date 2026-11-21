using CommonTestUtilities.Entities;
using Hozelo.Domain.Calculations;
using Shouldly;

namespace Domain.Tests.Entities;

public class RecurringEntryTest
{
    [Fact]
    public void Change_Amount_Freezes_Settled_Months_Without_Adjustment()
    {
        var entry = RecurringEntryBuilder.Build();
        entry.SettleMonth(new DateOnly(2027, 4, 1), new DateOnly(2027, 4, 5));
        entry.AdjustMonth(new DateOnly(2027, 5, 1), 5000m);

        entry.ChangeAmountFrom(new DateOnly(2027, 3, 1), 6600m);

        RecurrenceCalculator.For(entry, new DateOnly(2027, 4, 1))!.Amount.ShouldBe(6000m);
        RecurrenceCalculator.For(entry, new DateOnly(2027, 5, 1))!.Amount.ShouldBe(5000m);
        RecurrenceCalculator.For(entry, new DateOnly(2027, 6, 1))!.Amount.ShouldBe(6600m);
        RecurrenceCalculator.For(entry, new DateOnly(2027, 2, 1))!.Amount.ShouldBe(6000m);
    }

    [Fact]
    public void Change_Amount_On_Existing_Month_Replaces_It()
    {
        var entry = RecurringEntryBuilder.Build();

        entry.ChangeAmountFrom(entry.StartMonth, 6100m);

        entry.Amounts.Count.ShouldBe(1);
        entry.RuleAmount(new DateOnly(2030, 1, 1)).ShouldBe(6100m);
    }

    [Fact]
    public void Undo_Adjustment_Keeps_Settlement_And_Removes_Empty_Records()
    {
        var entry = RecurringEntryBuilder.Build();
        var december = new DateOnly(2026, 12, 1);
        entry.AdjustMonth(december, 5400m);
        entry.SettleMonth(december, new DateOnly(2026, 12, 6));

        entry.UndoMonthAdjustment(december);

        entry.MonthRecord(december)!.SettledOn.ShouldBe(new DateOnly(2026, 12, 6));
        entry.MonthRecord(december)!.Amount.ShouldBeNull();

        entry.UndoMonthSettlement(december);
        entry.Months.ShouldBeEmpty();
    }

    [Fact]
    public void Settle_Twice_Keeps_First_Date_And_Undo_Is_Idempotent()
    {
        var entry = RecurringEntryBuilder.Build();
        var month = new DateOnly(2026, 11, 1);

        entry.SettleMonth(month, new DateOnly(2026, 11, 5));
        entry.SettleMonth(month, new DateOnly(2026, 11, 9));
        entry.MonthRecord(month)!.SettledOn.ShouldBe(new DateOnly(2026, 11, 5));

        entry.UndoMonthSettlement(month);
        entry.UndoMonthSettlement(month);
        entry.UndoMonthAdjustment(month);
        entry.Months.ShouldBeEmpty();
    }

    [Fact]
    public void End_And_Reopen()
    {
        var entry = RecurringEntryBuilder.Build();

        entry.End(new DateOnly(2027, 6, 1));
        entry.IsWithinPeriod(new DateOnly(2027, 7, 1)).ShouldBeFalse();

        entry.Reopen();
        entry.IsWithinPeriod(new DateOnly(2027, 7, 1)).ShouldBeTrue();
    }
}
