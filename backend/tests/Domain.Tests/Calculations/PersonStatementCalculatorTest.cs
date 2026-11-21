using Hozelo.Domain.Calculations;
using Hozelo.Domain.Enums;
using Shouldly;

namespace Domain.Tests.Calculations;

public class PersonStatementCalculatorTest
{
    private static Charge C(DateOnly date, decimal amount) => new()
    {
        Key = $"Manual:{date.DayNumber}{amount}", OriginType = ChargeOriginType.Manual, OriginId = 1, Description = "x",
        Month = YearMonth.FirstDay(date), Date = date, Amount = amount
    };

    [Fact]
    public void Unpaid_Balance_Carries_To_Next_Month()
    {
        Charge[] charges = [C(new DateOnly(2026, 11, 10), 150m), C(new DateOnly(2026, 12, 10), 150m)];
        PaymentInput[] payments = [new(1, new DateOnly(2026, 11, 20), 100m, [])];

        var november = PersonStatementCalculator.Month(charges, payments, new DateOnly(2026, 11, 1));
        var december = PersonStatementCalculator.Month(charges, payments, new DateOnly(2026, 12, 1));

        november.PreviousBalance.ShouldBe(0m);
        november.EndBalance.ShouldBe(50m);
        december.PreviousBalance.ShouldBe(50m);
        december.TotalDue.ShouldBe(200m);
        december.EndBalance.ShouldBe(200m);
    }

    [Fact]
    public void Overpayment_Is_Credit_For_Next_Months()
    {
        Charge[] charges = [C(new DateOnly(2026, 12, 10), 100m), C(new DateOnly(2027, 1, 10), 100m)];
        PaymentInput[] payments = [new(1, new DateOnly(2026, 12, 20), 150m, [])];

        PersonStatementCalculator.Month(charges, payments, new DateOnly(2026, 12, 1)).EndBalance.ShouldBe(-50m);
        PersonStatementCalculator.Month(charges, payments, new DateOnly(2027, 1, 1)).EndBalance.ShouldBe(50m);
    }

    [Fact]
    public void Chained_Months_And_Totals()
    {
        var random = new Random(5);
        var charges = Enumerable.Range(0, 60).Select(i => C(new DateOnly(2025, 1, 1).AddDays(random.Next(0, 700)), random.Next(1, 50000) / 100m)).ToList();
        var payments = Enumerable.Range(0, 30).Select(i => new PaymentInput(i, new DateOnly(2025, 1, 1).AddDays(random.Next(0, 700)), random.Next(1, 50000) / 100m, [])).ToList();

        PersonMonthStatement? last = null;
        for (var month = new DateOnly(2025, 1, 1); month <= new DateOnly(2027, 1, 1); month = month.AddMonths(1))
        {
            var statement = PersonStatementCalculator.Month(charges, payments, month);
            if (last is not null)
                statement.PreviousBalance.ShouldBe(last.EndBalance);
            last = statement;
        }

        last!.EndBalance.ShouldBe(PersonStatementCalculator.OwedTotal(charges, payments));
        PersonStatementCalculator.OwedUntilNow(charges, payments, new DateOnly(2030, 1, 1)).ShouldBe(last.EndBalance);
    }
}
