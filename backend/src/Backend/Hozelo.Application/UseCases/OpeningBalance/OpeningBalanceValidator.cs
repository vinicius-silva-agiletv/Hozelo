using FluentValidation;
using Hozelo.Application.UseCases.Income;
using Hozelo.Communication.Requests;
using Hozelo.Domain.Calculations;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.OpeningBalance;

/// <summary>Regras de data-model.md (OpeningBalance.Amount, OpeningBalance.ReferenceDate).</summary>
public class OpeningBalanceValidator : AbstractValidator<RequestOpeningBalanceJson>
{
    public OpeningBalanceValidator()
    {
        RuleFor(r => r.Amount)
            .Must(InstallmentCalculator.HasAtMostTwoDecimals).WithMessage(ResourceMessagesException.AMOUNT_TOO_MANY_DECIMALS)
            .Must(v => Math.Abs(v) <= IncomeValidator.MaxAmount).WithMessage(ResourceMessagesException.AMOUNT_TOO_HIGH);

        RuleFor(r => r.ReferenceDate)
            .NotNull().WithMessage(ResourceMessagesException.OPENING_DATE_EMPTY);
    }
}
