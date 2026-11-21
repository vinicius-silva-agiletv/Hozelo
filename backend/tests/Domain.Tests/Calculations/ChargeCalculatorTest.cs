using CommonTestUtilities.Entities;
using Hozelo.Domain.Calculations;
using Hozelo.Domain.Entities;
using Hozelo.Domain.Enums;
using Shouldly;

namespace Domain.Tests.Calculations;

public class ChargeCalculatorTest
{
    private static Expense Marked(decimal total, int count, int percent, DateOnly? first = null)
    {
        var expense = ExpenseBuilder.Build(AmountType.Total, total, count, first ?? new DateOnly(2027, 1, 5));
        expense.PersonId = 2;
        expense.PersonPercent = percent;
        return expense;
    }

    [Fact]
    public void Full_Share_Uses_Installment_Amounts_And_Keys()
    {
        var charges = ChargeCalculator.ForExpense(Marked(1500m, 10, 100)).ToList();

        charges.Count.ShouldBe(10);
        charges.ShouldAllBe(c => c.Amount == 150m && c.OriginType == ChargeOriginType.Expense);
        charges[3].Number.ShouldBe(4);
        charges[3].Count.ShouldBe(10);
        charges[3].Month.ShouldBe(new DateOnly(2027, 4, 1));
        charges[0].Key.ShouldStartWith("Installment:");
    }

    [Theory]
    [InlineData(100.01, 3, 50)]
    [InlineData(999.99, 7, 33)]
    [InlineData(1500, 10, 1)]
    public void Percent_Share_Sums_Exactly(double total, int count, int percent)
    {
        var expense = Marked((decimal)total, count, percent);
        var expected = Math.Round((decimal)total * percent / 100m, 2, MidpointRounding.AwayFromZero);

        ChargeCalculator.ForExpense(expense).Sum(c => c.Amount).ShouldBe(expected);
    }

    [Fact]
    public void Amortized_Installment_Uses_Paid_Amount_And_Payment_Month()
    {
        var expense = Marked(1500m, 10, 100);
        expense.Installments.OrderBy(i => i.Number).Last().PayInAdvance(new DateOnly(2026, 12, 20), 100m);

        var last = ChargeCalculator.ForExpense(expense).Single(c => c.Number == 10);

        last.Amount.ShouldBe(100m);
        last.Month.ShouldBe(new DateOnly(2026, 12, 1));
    }

    [Fact]
    public void Unmarked_Expense_Has_No_Charges() =>
        ChargeCalculator.ForExpense(ExpenseBuilder.Build()).ShouldBeEmpty();

    [Fact]
    public void Fixed_Bill_Follows_Adjustments_And_Skips()
    {
        var bill = RecurringEntryBuilder.Build(80m, 10, new DateOnly(2026, 10, 1), kind: EntryKind.Expense);
        bill.PersonId = 2;
        bill.PersonPercent = 50;
        bill.AdjustMonth(new DateOnly(2026, 11, 1), 95m);
        bill.SkipMonth(new DateOnly(2026, 12, 1));

        var charges = ChargeCalculator.ForRecurrence(bill, bill.StartMonth, new DateOnly(2027, 2, 1)).ToList();

        charges.Select(c => (c.Month.Month, c.Amount)).ShouldBe([(10, 40m), (11, 47.50m), (1, 40m)]);
        charges[0].Key.ShouldBe("Recurrence:1:2026-10");
    }

    [Fact]
    public void Manual_Charge()
    {
        var charge = ChargeCalculator.ForManual(new PersonCharge { Id = 7, Description = "Empréstimo", Amount = 300m, ChargeDate = new DateOnly(2026, 12, 10) });

        charge.Key.ShouldBe("Manual:7");
        charge.Month.ShouldBe(new DateOnly(2026, 12, 1));
    }
}
