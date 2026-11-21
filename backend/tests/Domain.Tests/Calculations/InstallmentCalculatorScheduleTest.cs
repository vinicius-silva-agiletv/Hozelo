using Hozelo.Domain.Calculations;
using Hozelo.Domain.Enums;
using Shouldly;

namespace Domain.Tests.Calculations;

public class InstallmentCalculatorScheduleTest
{
    [Fact]
    public void Total_With_Remainder_Goes_To_Last_Installment()
    {
        var schedule = InstallmentCalculator.BuildSchedule(AmountType.Total, 100.00m, 3, new DateOnly(2027, 1, 5));

        schedule.TotalAmount.ShouldBe(100.00m);
        schedule.InstallmentAmount.ShouldBe(33.33m);
        schedule.Installments.Select(i => i.Amount).ShouldBe([33.33m, 33.33m, 33.34m]);
    }

    [Fact]
    public void Installment_Mode_Multiplies()
    {
        var schedule = InstallmentCalculator.BuildSchedule(AmountType.Installment, 1250.00m, 48, new DateOnly(2025, 1, 10));

        schedule.TotalAmount.ShouldBe(60000.00m);
        schedule.Installments.ShouldAllBe(i => i.Amount == 1250.00m);
        schedule.Installments[^1].DueDate.ShouldBe(new DateOnly(2028, 12, 10));
    }

    [Fact]
    public void Single_Payment_Has_One_Installment()
    {
        var schedule = InstallmentCalculator.BuildSchedule(AmountType.Total, 120.00m, 1, new DateOnly(2026, 12, 10));

        schedule.Installments.Count.ShouldBe(1);
        schedule.Installments[0].ShouldBe(new ScheduledInstallment(1, new DateOnly(2026, 12, 10), 120.00m));
    }

    [Theory]
    [InlineData(100.00, 3)]
    [InlineData(0.05, 5)]
    [InlineData(999.99, 7)]
    [InlineData(1234567.89, 480)]
    [InlineData(10.00, 3)]
    [InlineData(3000.00, 10)]
    public void Installments_Always_Sum_The_Total(double total, int count)
    {
        var amount = (decimal)total;

        var schedule = InstallmentCalculator.BuildSchedule(AmountType.Total, amount, count, new DateOnly(2027, 1, 1));

        schedule.Installments.Sum(i => i.Amount).ShouldBe(amount);
        schedule.Installments.Count.ShouldBe(count);
        schedule.Installments.ShouldAllBe(i => i.Amount > 0);
    }

    [Fact]
    public void Random_Totals_Always_Sum_Exactly()
    {
        var random = new Random(42);

        for (var n = 0; n < 500; n++)
        {
            var count = random.Next(1, 481);
            var amount = (decimal)random.Next(count, 100_000_000) / 100m;

            var schedule = InstallmentCalculator.BuildSchedule(AmountType.Total, amount, count, new DateOnly(2027, 1, 1));

            schedule.Installments.Sum(i => i.Amount).ShouldBe(amount);
        }
    }

    [Fact]
    public void Day_31_Uses_Last_Day_Of_Shorter_Months()
    {
        var schedule = InstallmentCalculator.BuildSchedule(AmountType.Total, 300.00m, 3, new DateOnly(2027, 1, 31));

        schedule.Installments.Select(i => i.DueDate)
            .ShouldBe([new DateOnly(2027, 1, 31), new DateOnly(2027, 2, 28), new DateOnly(2027, 3, 31)]);
    }

    [Fact]
    public void Leap_Year_February_Has_29()
    {
        InstallmentCalculator.DueDate(new DateOnly(2028, 1, 30), 1).ShouldBe(new DateOnly(2028, 2, 29));
    }

    [Fact]
    public void Crosses_The_Year()
    {
        var schedule = InstallmentCalculator.BuildSchedule(AmountType.Total, 30.00m, 3, new DateOnly(2026, 11, 15));

        schedule.Installments[^1].DueDate.ShouldBe(new DateOnly(2027, 1, 15));
    }

    [Fact]
    public void Four_Hundred_Eighty_Installments_Last_Date()
    {
        var schedule = InstallmentCalculator.BuildSchedule(AmountType.Installment, 1000.00m, 480, new DateOnly(2026, 1, 10));

        schedule.Installments[^1].DueDate.ShouldBe(new DateOnly(2065, 12, 10));
        schedule.Installments[^1].Number.ShouldBe(480);
    }

    [Fact]
    public void Amounts_Keep_Two_Decimal_Places()
    {
        var schedule = InstallmentCalculator.BuildSchedule(AmountType.Installment, 1250m, 2, new DateOnly(2026, 1, 10));

        schedule.TotalAmount.ToString(System.Globalization.CultureInfo.InvariantCulture).ShouldBe("2500.00");
    }
}
