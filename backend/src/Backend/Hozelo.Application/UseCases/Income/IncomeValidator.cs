using FluentValidation;
using Hozelo.Communication.Requests;
using Hozelo.Domain.Calculations;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.Income;

/// <summary>Regras de data-model.md (Income.Name, Income.Amount, Income.ExpectedDate, Income.Notes).</summary>
public class IncomeValidator : AbstractValidator<RequestUpdateIncomeJson>
{
    public const int NameMaxLength = 100;
    public const int NotesMaxLength = 500;
    public const decimal MaxAmount = 9_999_999_999.99m;

    public IncomeValidator()
    {
        RuleFor(r => r.Name)
            .NotEmpty().WithMessage(ResourceMessagesException.NAME_EMPTY)
            .MaximumLength(NameMaxLength).WithMessage(ResourceMessagesException.NAME_TOO_LONG);

        RuleFor(r => r.CategoryId)
            .GreaterThan(0).WithMessage(ResourceMessagesException.CATEGORY_REQUIRED);

        RuleFor(r => r.Amount).SetValidator(new AmountValidator());

        RuleFor(r => r.ExpectedDate)
            .NotNull().WithMessage(ResourceMessagesException.EXPECTED_DATE_EMPTY);

        RuleFor(r => r.Notes)
            .MaximumLength(NotesMaxLength).WithMessage(ResourceMessagesException.EXPENSE_NOTES_TOO_LONG);
    }

    public static void Normalize(RequestUpdateIncomeJson request)
    {
        request.Name = request.Name?.Trim() ?? string.Empty;
        request.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
    }
}

/// <summary>Valor positivo, com até 2 casas e até R$ 9.999.999.999,99.</summary>
public class AmountValidator : AbstractValidator<decimal>
{
    public AmountValidator()
    {
        RuleFor(v => v)
            .GreaterThan(0).WithMessage(ResourceMessagesException.AMOUNT_MUST_BE_POSITIVE);

        When(v => v > 0, () =>
        {
            RuleFor(v => v)
                .Must(InstallmentCalculator.HasAtMostTwoDecimals).WithMessage(ResourceMessagesException.AMOUNT_TOO_MANY_DECIMALS)
                .LessThanOrEqualTo(IncomeValidator.MaxAmount).WithMessage(ResourceMessagesException.AMOUNT_TOO_HIGH);
        });
    }
}
