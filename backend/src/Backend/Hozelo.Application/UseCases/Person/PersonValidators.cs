using FluentValidation;
using Hozelo.Application.UseCases.Income;
using Hozelo.Communication.Requests;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.Person;

/// <summary>data-model.md: Person.Name.</summary>
public class PersonValidator : AbstractValidator<RequestPersonJson>
{
    public const int NameMaxLength = 50;

    public PersonValidator()
    {
        RuleFor(r => r.Name)
            .NotEmpty().WithMessage(ResourceMessagesException.PERSON_NAME_EMPTY)
            .MaximumLength(NameMaxLength).WithMessage(ResourceMessagesException.PERSON_NAME_TOO_LONG);
    }
}

/// <summary>data-model.md: PersonCharge.Description, PersonCharge.Amount, PersonCharge.ChargeDate, PersonCharge.Notes.</summary>
public class PersonChargeValidator : AbstractValidator<RequestPersonChargeJson>
{
    public PersonChargeValidator()
    {
        RuleFor(r => r.Description)
            .NotEmpty().WithMessage(ResourceMessagesException.DESCRIPTION_EMPTY)
            .MaximumLength(100).WithMessage(ResourceMessagesException.DESCRIPTION_TOO_LONG);

        RuleFor(r => r.Amount).SetValidator(new AmountValidator());

        RuleFor(r => r.ChargeDate).NotNull().WithMessage(ResourceMessagesException.CHARGE_DATE_EMPTY);

        RuleFor(r => r.Notes).MaximumLength(500).WithMessage(ResourceMessagesException.EXPENSE_NOTES_TOO_LONG);
    }
}

/// <summary>data-model.md: PersonPayment.Amount, PersonPayment.PaidOn, PersonPayment.Notes.</summary>
public class PersonPaymentValidator : AbstractValidator<RequestPersonPaymentJson>
{
    public PersonPaymentValidator()
    {
        RuleFor(r => r.Amount).SetValidator(new AmountValidator());

        RuleFor(r => r.PaidOn).NotNull().WithMessage(ResourceMessagesException.PAYMENT_DATE_EMPTY);

        RuleFor(r => r.Notes).MaximumLength(500).WithMessage(ResourceMessagesException.EXPENSE_NOTES_TOO_LONG);
    }
}

/// <summary>Regras da marcação comuns a despesas e contas fixas (data-model.md, Expense.PersonPercent).</summary>
public static class PersonMarkingRules
{
    public static void Add<T>(AbstractValidator<T> validator, Func<T, long?> personId, Func<T, int?> percent)
    {
        validator.RuleFor(r => percent(r))
            .Must(p => p is null || p is >= 1 and <= 100)
            .OverridePropertyName("PersonPercent")
            .WithMessage(ResourceMessagesException.PERSON_PERCENT_INVALID);

        validator.RuleFor(r => r)
            .Must(r => percent(r) is null || personId(r) is not null)
            .OverridePropertyName("PersonPercent")
            .WithMessage(ResourceMessagesException.PERSON_PERCENT_WITHOUT_PERSON);
    }
}
