using FluentValidation;
using Hozelo.Communication.Requests;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.Expense.Register;

public class RegisterExpenseValidator : AbstractValidator<RequestRegisterExpenseJson>
{
    public RegisterExpenseValidator()
    {
        Include(new ExpenseValidator());

        RuleFor(r => r.AlreadyPaidInstallments)
            .Must((r, paid) => paid >= 0 && paid <= r.InstallmentsCount)
            .WithMessage(ResourceMessagesException.ALREADY_PAID_INSTALLMENTS_OUT_OF_RANGE);
    }
}
