using Hozelo.Domain.Calculations;
using Hozelo.Domain.Enums;
using Shouldly;

namespace Domain.Tests.Calculations;

public class PaymentAllocatorTest
{
    private static Charge C(string key, int month, decimal amount) => new()
    {
        Key = key, OriginType = ChargeOriginType.Manual, OriginId = 1, Description = key,
        Month = new DateOnly(2026, month, 1), Date = new DateOnly(2026, month, 10), Amount = amount
    };

    private static PaymentInput P(long id, int month, decimal amount, params string[] targets) =>
        new(id, new DateOnly(2026, month, 15), amount, targets);

    private readonly Charge[] _charges = [C("Manual:1", 11, 50m), C("Manual:2", 12, 150m), C("Manual:3", 12, 200m)];

    [Fact]
    public void Without_Choice_Pays_Oldest_First()
    {
        var result = PaymentAllocator.Allocate(_charges, [P(1, 12, 100m)]);

        result.Charges["Manual:1"].Status.ShouldBe(ChargeStatus.Paid);
        result.Charges["Manual:2"].Paid.ShouldBe(50m);
        result.Charges["Manual:2"].Status.ShouldBe(ChargeStatus.Partial);
        result.Charges["Manual:3"].Status.ShouldBe(ChargeStatus.Open);
    }

    [Fact]
    public void Chosen_Charges_First_Then_Oldest()
    {
        var result = PaymentAllocator.Allocate(_charges, [P(1, 12, 180m, "Manual:2")]);

        result.Charges["Manual:2"].Status.ShouldBe(ChargeStatus.Paid);
        result.Charges["Manual:1"].Paid.ShouldBe(30m);
        result.Charges["Manual:3"].Paid.ShouldBe(0m);
    }

    [Fact]
    public void Chosen_Bigger_Than_Payment_Leaves_Last_Partial()
    {
        var result = PaymentAllocator.Allocate(_charges, [P(1, 12, 250m, "Manual:3", "Manual:2")]);

        result.Charges["Manual:2"].Status.ShouldBe(ChargeStatus.Paid);
        result.Charges["Manual:3"].Paid.ShouldBe(100m);
        result.Charges["Manual:1"].Paid.ShouldBe(0m);
    }

    [Fact]
    public void Missing_Key_Is_Ignored_And_Overpayment_Becomes_Credit()
    {
        var result = PaymentAllocator.Allocate(_charges, [P(1, 12, 450m, "Installment:999")]);

        result.Charges.Values.ShouldAllBe(c => c.Status == ChargeStatus.Paid);
        result.UnallocatedCredit.ShouldBe(50m);
    }

    [Fact]
    public void Payments_Apply_In_Date_Order_And_Record_Payment_Ids()
    {
        var result = PaymentAllocator.Allocate(_charges, [P(2, 12, 100m), P(1, 11, 60m)]);

        result.Charges["Manual:1"].PaymentIds.ShouldBe([1]);
        result.Charges["Manual:2"].Paid.ShouldBe(110m);
        result.Charges["Manual:2"].PaymentIds.ShouldBe([1, 2]);
    }
}
