using FluentValidation;
using Hozelo.Communication.Requests;
using Hozelo.Domain.Calculations;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.Expense.Amortize;

/// <summary>Regras de formato da amortização (data-model.md, ExpenseInstallment.PaidAmount).</summary>
public class AmortizeExpenseValidator : AbstractValidator<RequestAmortizeExpenseJson>
{
    public AmortizeExpenseValidator()
    {
        RuleFor(r => r)
            .Must(r => HasNumbers(r) != r.Quantity.HasValue)
            .WithName(nameof(RequestAmortizeExpenseJson.InstallmentNumbers))
            .WithMessage(ResourceMessagesException.AMORTIZATION_SELECTION_REQUIRED);

        RuleFor(r => r.PaidAmount)
            .Must(v => v > 0 && InstallmentCalculator.HasAtMostTwoDecimals(v))
            .WithMessage(ResourceMessagesException.PAID_AMOUNT_INVALID);
    }

    private static bool HasNumbers(RequestAmortizeExpenseJson r) => r.InstallmentNumbers is { Count: > 0 };
}
