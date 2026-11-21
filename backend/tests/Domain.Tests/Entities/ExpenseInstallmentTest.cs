using Hozelo.Domain.Entities;
using Shouldly;

namespace Domain.Tests.Entities;

public class ExpenseInstallmentTest
{
    private static ExpenseInstallment Open() => new() { Number = 1, DueDate = new DateOnly(2026, 11, 10), Amount = 100m };

    [Fact]
    public void Pay_Uses_Full_Amount()
    {
        var installment = Open();

        installment.Pay(new DateOnly(2026, 11, 12));

        installment.IsPaid.ShouldBeTrue();
        installment.PaidAmount.ShouldBe(100m);
        installment.Discount.ShouldBe(0m);
        installment.Prepaid.ShouldBeFalse();
    }

    [Fact]
    public void Pay_Twice_Keeps_First_Payment()
    {
        var installment = Open();
        installment.Pay(new DateOnly(2026, 11, 12));

        installment.Pay(new DateOnly(2026, 11, 20));

        installment.PaidOn.ShouldBe(new DateOnly(2026, 11, 12));
    }

    [Fact]
    public void Pay_In_Advance_Records_Discount()
    {
        var installment = Open();

        installment.PayInAdvance(new DateOnly(2026, 10, 1), 80m);

        installment.Prepaid.ShouldBeTrue();
        installment.Discount.ShouldBe(20m);
    }

    [Fact]
    public void Undo_Reopens()
    {
        var installment = Open();
        installment.PayInAdvance(new DateOnly(2026, 10, 1), 80m);

        installment.UndoPayment();
        installment.UndoPayment();

        installment.IsPaid.ShouldBeFalse();
        installment.PaidAmount.ShouldBeNull();
        installment.Prepaid.ShouldBeFalse();
        installment.Discount.ShouldBe(0m);
    }
}
