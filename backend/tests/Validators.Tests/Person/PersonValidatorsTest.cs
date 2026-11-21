using CommonTestUtilities.Requests;
using Hozelo.Application.UseCases.Expense.Register;
using Hozelo.Application.UseCases.Person;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace Validators.Tests.Person;

public class PersonValidatorsTest
{
    [Fact]
    public void Person_Name()
    {
        var validator = new PersonValidator();
        validator.Validate(RequestPersonJsonBuilder.Build()).IsValid.ShouldBeTrue();
        validator.Validate(new RequestPersonJson { Name = "" }).Errors.Select(e => e.ErrorMessage).ShouldBe([ResourceMessagesException.PERSON_NAME_EMPTY]);
        validator.Validate(new RequestPersonJson { Name = new string('a', 51) }).Errors.Select(e => e.ErrorMessage).ShouldBe([ResourceMessagesException.PERSON_NAME_TOO_LONG]);
    }

    [Fact]
    public void Charge_Rules()
    {
        var validator = new PersonChargeValidator();
        validator.Validate(RequestPersonJsonBuilder.Charge()).IsValid.ShouldBeTrue();
        validator.Validate(new RequestPersonChargeJson()).Errors.Select(e => e.ErrorMessage).ShouldBe(
            [ResourceMessagesException.DESCRIPTION_EMPTY, ResourceMessagesException.AMOUNT_MUST_BE_POSITIVE, ResourceMessagesException.CHARGE_DATE_EMPTY],
            ignoreOrder: true);
        validator.Validate(new RequestPersonChargeJson { Description = new string('a', 101), Amount = 1, ChargeDate = new DateOnly(2026, 1, 1) })
            .Errors.Select(e => e.ErrorMessage).ShouldBe([ResourceMessagesException.DESCRIPTION_TOO_LONG]);
    }

    [Fact]
    public void Payment_Rules()
    {
        var validator = new PersonPaymentValidator();
        validator.Validate(RequestPersonJsonBuilder.Payment(100m, new DateOnly(2026, 11, 1))).IsValid.ShouldBeTrue();
        validator.Validate(new RequestPersonPaymentJson { Amount = 1.001m }).Errors.Select(e => e.ErrorMessage).ShouldBe(
            [ResourceMessagesException.AMOUNT_TOO_MANY_DECIMALS, ResourceMessagesException.PAYMENT_DATE_EMPTY], ignoreOrder: true);
    }

    [Theory]
    [InlineData(2L, 0, "PERSON_PERCENT_INVALID")]
    [InlineData(2L, 101, "PERSON_PERCENT_INVALID")]
    [InlineData(null, 50, "PERSON_PERCENT_WITHOUT_PERSON")]
    public void Expense_Marking(long? personId, int percent, string key)
    {
        var request = RequestRegisterExpenseJsonBuilder.Build();
        request.PersonId = personId;
        request.PersonPercent = percent;

        new RegisterExpenseValidator().Validate(request).Errors.Select(e => e.ErrorMessage)
            .ShouldBe([ResourceMessagesException.ResourceManager.GetString(key)!]);
    }

    [Fact]
    public void Income_Recurrence_Cannot_Be_Marked()
    {
        var request = RequestRecurrenceJsonBuilder.Salary();
        request.PersonId = 2;

        new Hozelo.Application.UseCases.Recurrence.RecurrenceValidator().Validate(request).Errors.Select(e => e.ErrorMessage)
            .ShouldBe([ResourceMessagesException.RECURRENCE_INCOME_CANNOT_BE_MARKED]);
    }
}
