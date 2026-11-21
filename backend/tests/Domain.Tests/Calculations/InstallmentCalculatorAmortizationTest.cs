using Hozelo.Domain.Calculations;
using Shouldly;

namespace Domain.Tests.Calculations;

public class InstallmentCalculatorAmortizationTest
{
    [Fact]
    public void Equal_Installments_Share_Equally()
    {
        var shares = InstallmentCalculator.DistributePayment(Enumerable.Repeat(1250.00m, 6).ToList(), 6000.00m);

        shares.ShouldAllBe(s => s == 1000.00m);
    }

    [Fact]
    public void Paid_Equal_To_Sum_Has_No_Discount()
    {
        decimal[] amounts = [33.33m, 33.33m, 33.34m];

        var shares = InstallmentCalculator.DistributePayment(amounts, 100.00m);

        shares.ShouldBe(amounts);
    }

    [Fact]
    public void Leftover_Cents_Go_To_Largest_Remainders()
    {
        var shares = InstallmentCalculator.DistributePayment([33.33m, 33.33m, 33.34m], 50.00m);

        shares.Sum().ShouldBe(50.00m);
        shares.ShouldBe([16.66m, 16.67m, 16.67m]);
    }

    [Fact]
    public void Random_Distributions_Are_Exact_And_Never_Exceed_The_Installment()
    {
        var random = new Random(7);

        for (var n = 0; n < 500; n++)
        {
            var count = random.Next(1, 30);
            var amounts = Enumerable.Range(0, count).Select(_ => (decimal)random.Next(100, 500_000) / 100m).ToList();
            var totalCents = (long)(amounts.Sum() * 100);
            var paid = (decimal)random.NextInt64(count, totalCents + 1) / 100m;

            var shares = InstallmentCalculator.DistributePayment(amounts, paid);

            shares.Sum().ShouldBe(paid);
            for (var i = 0; i < count; i++)
                shares[i].ShouldBeLessThanOrEqualTo(amounts[i]);
        }
    }

    [Fact]
    public void Empty_Selection_Returns_Empty()
    {
        InstallmentCalculator.DistributePayment([], 10m).ShouldBeEmpty();
    }
}
