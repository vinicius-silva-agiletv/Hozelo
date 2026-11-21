using CommonTestUtilities.Requests;
using Hozelo.Application.UseCases.Recurrence;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace Validators.Tests.Recurrence;

public class RecurrenceValidatorTest
{
    private static IList<string> Errors(RequestRecurrenceJson r) =>
        new RecurrenceValidator().Validate(r).Errors.Select(e => e.ErrorMessage).ToList();

    private static void ShouldFail(Action<RequestRecurrenceJson> change, string message)
    {
        var request = RequestRecurrenceJsonBuilder.Salary();
        change(request);
        Errors(request).ShouldBe([message]);
    }

    [Fact]
    public void Success_Salary_And_Bill_With_End()
    {
        Errors(RequestRecurrenceJsonBuilder.Salary()).ShouldBeEmpty();
        var bill = RequestRecurrenceJsonBuilder.Bill();
        bill.EndMonth = "2027-06";
        Errors(bill).ShouldBeEmpty();
    }

    [Fact]
    public void Error_Kind_Missing() => ShouldFail(r => r.Kind = null, ResourceMessagesException.RECURRENCE_KIND_INVALID);

    [Fact]
    public void Error_Kind_Out_Of_Range() => ShouldFail(r => r.Kind = (EntryKind)5, ResourceMessagesException.RECURRENCE_KIND_INVALID);

    [Theory]
    [InlineData(0)]
    [InlineData(32)]
    public void Error_Day(int day) => ShouldFail(r => r.DayOfMonth = day, ResourceMessagesException.DAY_OF_MONTH_INVALID);

    [Theory]
    [InlineData("")]
    [InlineData("2026-1")]
    [InlineData("01/2026")]
    public void Error_Start_Month(string month) => ShouldFail(r => r.StartMonth = month, ResourceMessagesException.MONTH_FORMAT_INVALID);

    [Fact]
    public void Error_End_Month_Format() => ShouldFail(r => r.EndMonth = "x", ResourceMessagesException.MONTH_FORMAT_INVALID);

    [Fact]
    public void Error_End_Before_Start() => ShouldFail(r => r.EndMonth = "2025-12", ResourceMessagesException.END_BEFORE_START);

    [Fact]
    public void Error_Amount() => ShouldFail(r => r.Amount = -1, ResourceMessagesException.AMOUNT_MUST_BE_POSITIVE);

    [Fact]
    public void Error_Name() => ShouldFail(r => r.Name = " ", ResourceMessagesException.NAME_EMPTY);

    [Fact]
    public void Adjust_Requires_Amount_Or_Skip()
    {
        var validator = new AdjustRecurrenceMonthValidator();

        validator.Validate(new RequestAdjustRecurrenceMonthJson()).Errors.Select(e => e.ErrorMessage)
            .ShouldBe([ResourceMessagesException.MONTH_ADJUSTMENT_EMPTY]);
        validator.Validate(new RequestAdjustRecurrenceMonthJson { Amount = 0 }).Errors.Select(e => e.ErrorMessage)
            .ShouldBe([ResourceMessagesException.AMOUNT_MUST_BE_POSITIVE]);
        validator.Validate(new RequestAdjustRecurrenceMonthJson { Skipped = true }).IsValid.ShouldBeTrue();
    }

    [Fact]
    public void Change_Amount_Requires_Valid_Month()
    {
        new ChangeRecurrenceAmountValidator().Validate(new RequestChangeRecurrenceAmountJson { Amount = 10, FromMonth = "03/2027" })
            .Errors.Select(e => e.ErrorMessage).ShouldBe([ResourceMessagesException.MONTH_FORMAT_INVALID]);
    }
}
