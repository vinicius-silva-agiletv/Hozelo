using Hozelo.Application.UseCases.OpeningBalance;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace Validators.Tests.OpeningBalance;

public class OpeningBalanceValidatorTest
{
    private static IList<string> Errors(RequestOpeningBalanceJson r) =>
        new OpeningBalanceValidator().Validate(r).Errors.Select(e => e.ErrorMessage).ToList();

    [Theory]
    [InlineData(3200.00)]
    [InlineData(0)]
    [InlineData(-850.50)]
    public void Success(decimal amount) =>
        Errors(new() { Amount = amount, ReferenceDate = new DateOnly(2026, 11, 1) }).ShouldBeEmpty();

    [Fact]
    public void Error_Date_Missing() =>
        Errors(new() { Amount = 1 }).ShouldBe([ResourceMessagesException.OPENING_DATE_EMPTY]);

    [Fact]
    public void Error_Decimals_And_Too_High()
    {
        Errors(new() { Amount = 1.001m, ReferenceDate = new DateOnly(2026, 1, 1) }).ShouldBe([ResourceMessagesException.AMOUNT_TOO_MANY_DECIMALS]);
        Errors(new() { Amount = -10_000_000_000m, ReferenceDate = new DateOnly(2026, 1, 1) }).ShouldBe([ResourceMessagesException.AMOUNT_TOO_HIGH]);
    }
}
