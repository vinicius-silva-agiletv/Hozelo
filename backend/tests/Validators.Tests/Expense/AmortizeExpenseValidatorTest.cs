using Hozelo.Application.UseCases.Expense.Amortize;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace Validators.Tests.Expense;

public class AmortizeExpenseValidatorTest
{
    private static IList<string> Errors(RequestAmortizeExpenseJson request) =>
        new AmortizeExpenseValidator().Validate(request).Errors.Select(e => e.ErrorMessage).ToList();

    [Fact]
    public void Success_With_Numbers() =>
        Errors(new() { InstallmentNumbers = [47, 48], PaidAmount = 2000m }).ShouldBeEmpty();

    [Fact]
    public void Success_With_Quantity() =>
        Errors(new() { Quantity = 6, PaidAmount = 6000m }).ShouldBeEmpty();

    [Fact]
    public void Error_Neither_Numbers_Nor_Quantity() =>
        Errors(new() { InstallmentNumbers = [], PaidAmount = 10m })
            .ShouldBe([ResourceMessagesException.AMORTIZATION_SELECTION_REQUIRED]);

    [Fact]
    public void Error_Both_Numbers_And_Quantity() =>
        Errors(new() { InstallmentNumbers = [1], Quantity = 1, PaidAmount = 10m })
            .ShouldBe([ResourceMessagesException.AMORTIZATION_SELECTION_REQUIRED]);

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(10.001)]
    public void Error_Paid_Amount_Invalid(decimal paid) =>
        Errors(new() { Quantity = 1, PaidAmount = paid }).ShouldBe([ResourceMessagesException.PAID_AMOUNT_INVALID]);
}
