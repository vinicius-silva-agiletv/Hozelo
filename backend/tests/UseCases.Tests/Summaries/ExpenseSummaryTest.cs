using CommonTestUtilities.Entities;
using Hozelo.Application.Summaries;
using Shouldly;

namespace UseCases.Tests.Summaries;

public class ExpenseSummaryTest
{
    [Fact]
    public void Open_Expense()
    {
        var expense = ExpenseBuilder.Build(count: 48, alreadyPaid: 10);

        var summary = ExpenseSummary.From(expense);

        summary.PaidInstallments.ShouldBe(10);
        summary.RemainingInstallments.ShouldBe(38);
        summary.PaidAmount.ShouldBe(12500m);
        summary.RemainingAmount.ShouldBe(47500m);
        summary.IsPaid.ShouldBeFalse();
        summary.NextDueDate.ShouldBe(new DateOnly(2025, 11, 10));
        summary.LastDueDate.ShouldBe(new DateOnly(2028, 12, 10));
    }

    [Fact]
    public void Discount_Keeps_The_Invariant()
    {
        var expense = ExpenseBuilder.Build(count: 48, alreadyPaid: 10);
        foreach (var installment in expense.Installments.OrderBy(i => i.Number).TakeLast(6))
            installment.PayInAdvance(new DateOnly(2026, 11, 21), 1000m);

        var summary = ExpenseSummary.From(expense);

        summary.DiscountAmount.ShouldBe(1500m);
        summary.NextDueDate.ShouldBe(new DateOnly(2025, 11, 10));
        (summary.PaidAmount + summary.DiscountAmount + summary.RemainingAmount).ShouldBe(expense.TotalAmount);
    }

    [Fact]
    public void Paid_Expense_Has_No_Next_Due_Date()
    {
        var summary = ExpenseSummary.From(ExpenseBuilder.Build(count: 3, alreadyPaid: 3));

        summary.IsPaid.ShouldBeTrue();
        summary.NextDueDate.ShouldBeNull();
        summary.RemainingAmount.ShouldBe(0m);
    }
}
