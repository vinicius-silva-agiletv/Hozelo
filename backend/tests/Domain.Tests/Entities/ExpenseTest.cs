using CommonTestUtilities.Entities;
using Hozelo.Domain.Enums;
using Shouldly;

namespace Domain.Tests.Entities;

public class ExpenseTest
{
    [Fact]
    public void Already_Paid_Marks_The_First_Installments_On_Their_Due_Dates()
    {
        var expense = ExpenseBuilder.Build(count: 60, alreadyPaid: 24);

        var paid = expense.Installments.Where(i => i.IsPaid).OrderBy(i => i.Number).ToList();
        paid.Count.ShouldBe(24);
        paid.Select(i => i.Number).ShouldBe(Enumerable.Range(1, 24));
        paid.ShouldAllBe(i => i.PaidOn == i.DueDate && i.PaidAmount == i.Amount);
    }

    [Fact]
    public void Reschedule_Keeps_First_N_Paid_With_Old_Dates_In_Order()
    {
        var expense = ExpenseBuilder.Build(count: 10);
        var installments = expense.Installments.OrderBy(i => i.Number).ToList();
        installments[0].Pay(new DateOnly(2025, 3, 1));
        installments[4].Pay(new DateOnly(2025, 2, 1));
        installments[9].Pay(new DateOnly(2025, 4, 1));

        expense.Reschedule(AmountType.Installment, 1000.00m, 12, new DateOnly(2025, 6, 15));

        var ordered = expense.Installments.OrderBy(i => i.Number).ToList();
        ordered.Count.ShouldBe(12);
        expense.TotalAmount.ShouldBe(12000.00m);
        ordered.Take(3).Select(i => i.PaidOn).ShouldBe(
            [new DateOnly(2025, 2, 1), new DateOnly(2025, 3, 1), new DateOnly(2025, 4, 1)]);
        ordered.Take(3).ShouldAllBe(i => i.PaidAmount == 1000.00m);
        ordered.Skip(3).ShouldAllBe(i => !i.IsPaid);
        ordered[0].DueDate.ShouldBe(new DateOnly(2025, 6, 15));
    }

    [Fact]
    public void Reschedule_To_Fewer_Installments_Removes_The_Surplus()
    {
        var expense = ExpenseBuilder.Build(count: 10);

        expense.Reschedule(AmountType.Total, 900.00m, 3, expense.FirstDueDate);

        expense.Installments.Count.ShouldBe(3);
        expense.Installments.Select(i => i.Number).Order().ShouldBe([1, 2, 3]);
        expense.Installments.Sum(i => i.Amount).ShouldBe(900.00m);
    }

    [Fact]
    public void Informed_Amount_Follows_The_Amount_Type()
    {
        ExpenseBuilder.Build(AmountType.Total, 3000m, 10).InformedAmount.ShouldBe(3000m);
        ExpenseBuilder.Build(AmountType.Installment, 300m, 10).InformedAmount.ShouldBe(300m);
    }
}
