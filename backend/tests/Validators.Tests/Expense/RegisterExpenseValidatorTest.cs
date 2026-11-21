using CommonTestUtilities.Requests;
using Hozelo.Application.UseCases.Expense.Register;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace Validators.Tests.Expense;

public class RegisterExpenseValidatorTest
{
    private static IList<string> Errors(RequestRegisterExpenseJson request) =>
        new RegisterExpenseValidator().Validate(request).Errors.Select(e => e.ErrorMessage).ToList();

    private static void ShouldFailWith(Action<RequestRegisterExpenseJson> change, string message)
    {
        var request = RequestRegisterExpenseJsonBuilder.Build();
        change(request);

        Errors(request).ShouldBe([message]);
    }

    [Fact]
    public void Success_Installments()
    {
        Errors(RequestRegisterExpenseJsonBuilder.Build()).ShouldBeEmpty();
    }

    [Fact]
    public void Success_Single_Payment()
    {
        Errors(RequestRegisterExpenseJsonBuilder.Single(1, 120m, new DateOnly(2026, 12, 10))).ShouldBeEmpty();
    }

    [Fact]
    public void Success_Already_Paid_All()
    {
        var request = RequestRegisterExpenseJsonBuilder.Build();
        request.AlreadyPaidInstallments = 10;

        Errors(request).ShouldBeEmpty();
    }

    [Fact]
    public void Error_Name_Empty() => ShouldFailWith(r => r.Name = "", ResourceMessagesException.EXPENSE_NAME_EMPTY);

    [Fact]
    public void Error_Name_Too_Long() =>
        ShouldFailWith(r => r.Name = new string('a', 101), ResourceMessagesException.EXPENSE_NAME_TOO_LONG);

    [Fact]
    public void Error_Category_Empty() => ShouldFailWith(r => r.CategoryId = 0, ResourceMessagesException.EXPENSE_CATEGORY_EMPTY);

    [Fact]
    public void Error_Amount_Type_Missing() =>
        ShouldFailWith(r => r.AmountType = null, ResourceMessagesException.EXPENSE_AMOUNT_TYPE_INVALID);

    [Fact]
    public void Error_Amount_Type_Out_Of_Range() =>
        ShouldFailWith(r => r.AmountType = (AmountType)9, ResourceMessagesException.EXPENSE_AMOUNT_TYPE_INVALID);

    [Theory]
    [InlineData(0)]
    [InlineData(-10)]
    public void Error_Amount_Not_Positive(decimal amount) =>
        ShouldFailWith(r => r.Amount = amount, ResourceMessagesException.AMOUNT_MUST_BE_POSITIVE);

    [Fact]
    public void Error_Amount_Three_Decimals() =>
        ShouldFailWith(r => r.Amount = 10.123m, ResourceMessagesException.AMOUNT_TOO_MANY_DECIMALS);

    [Fact]
    public void Error_Single_Payment_With_Two_Installments() =>
        ShouldFailWith(r => { r.IsInstallment = false; r.InstallmentsCount = 2; },
            ResourceMessagesException.SINGLE_PAYMENT_MUST_HAVE_ONE_INSTALLMENT);

    [Theory]
    [InlineData(1)]
    [InlineData(481)]
    public void Error_Installments_Out_Of_Range(int count) =>
        ShouldFailWith(r => { r.InstallmentsCount = count; r.AlreadyPaidInstallments = 0; },
            ResourceMessagesException.INSTALLMENTS_COUNT_OUT_OF_RANGE);

    [Fact]
    public void Error_First_Due_Date_Missing() =>
        ShouldFailWith(r => r.FirstDueDate = null, ResourceMessagesException.FIRST_DUE_DATE_EMPTY);

    [Theory]
    [InlineData(-1)]
    [InlineData(11)]
    public void Error_Already_Paid_Out_Of_Range(int paid) =>
        ShouldFailWith(r => r.AlreadyPaidInstallments = paid, ResourceMessagesException.ALREADY_PAID_INSTALLMENTS_OUT_OF_RANGE);

    [Fact]
    public void Error_Total_Too_Small_For_Installments() =>
        ShouldFailWith(r => r.Amount = 0.09m, ResourceMessagesException.TOTAL_TOO_SMALL_FOR_INSTALLMENTS);

    [Fact]
    public void Error_Total_Too_High() =>
        ShouldFailWith(r => { r.AmountType = AmountType.Installment; r.Amount = 5_000_000_000m; },
            ResourceMessagesException.EXPENSE_TOTAL_TOO_HIGH);

    [Fact]
    public void Error_Notes_Too_Long() =>
        ShouldFailWith(r => r.Notes = new string('a', 501), ResourceMessagesException.EXPENSE_NOTES_TOO_LONG);

    [Fact]
    public void Error_Returns_All_Messages_Together()
    {
        var errors = Errors(new RequestRegisterExpenseJson { IsInstallment = true, InstallmentsCount = 0 });

        errors.ShouldBe(
        [
            ResourceMessagesException.EXPENSE_NAME_EMPTY,
            ResourceMessagesException.EXPENSE_CATEGORY_EMPTY,
            ResourceMessagesException.EXPENSE_AMOUNT_TYPE_INVALID,
            ResourceMessagesException.AMOUNT_MUST_BE_POSITIVE,
            ResourceMessagesException.INSTALLMENTS_COUNT_OUT_OF_RANGE,
            ResourceMessagesException.FIRST_DUE_DATE_EMPTY
        ], ignoreOrder: true);
    }
}
