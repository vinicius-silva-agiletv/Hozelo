using CommonTestUtilities.Requests;
using Hozelo.Application.UseCases.Income;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace Validators.Tests.Income;

public class IncomeValidatorTest
{
    private static IList<string> Errors(RequestUpdateIncomeJson r) =>
        new IncomeValidator().Validate(r).Errors.Select(e => e.ErrorMessage).ToList();

    private static void ShouldFail(Action<RequestIncomeJson> change, string message)
    {
        var request = RequestIncomeJsonBuilder.Build();
        change(request);
        Errors(request).ShouldBe([message]);
    }

    [Fact]
    public void Success() => Errors(RequestIncomeJsonBuilder.Build()).ShouldBeEmpty();

    [Fact]
    public void Error_Name_Empty() => ShouldFail(r => r.Name = "", ResourceMessagesException.NAME_EMPTY);

    [Fact]
    public void Error_Name_Too_Long() => ShouldFail(r => r.Name = new string('a', 101), ResourceMessagesException.NAME_TOO_LONG);

    [Fact]
    public void Error_Category_Missing() => ShouldFail(r => r.CategoryId = 0, ResourceMessagesException.CATEGORY_REQUIRED);

    [Fact]
    public void Error_Amount_Zero() => ShouldFail(r => r.Amount = 0, ResourceMessagesException.AMOUNT_MUST_BE_POSITIVE);

    [Fact]
    public void Error_Amount_Decimals() => ShouldFail(r => r.Amount = 1.001m, ResourceMessagesException.AMOUNT_TOO_MANY_DECIMALS);

    [Fact]
    public void Error_Amount_Too_High() => ShouldFail(r => r.Amount = 10_000_000_000m, ResourceMessagesException.AMOUNT_TOO_HIGH);

    [Fact]
    public void Error_Expected_Date_Missing() => ShouldFail(r => r.ExpectedDate = null, ResourceMessagesException.EXPECTED_DATE_EMPTY);

    [Fact]
    public void Error_Notes_Too_Long() => ShouldFail(r => r.Notes = new string('a', 501), ResourceMessagesException.EXPENSE_NOTES_TOO_LONG);

    [Fact]
    public void Error_All_Together() =>
        Errors(new RequestIncomeJson()).Count.ShouldBe(4);
}
