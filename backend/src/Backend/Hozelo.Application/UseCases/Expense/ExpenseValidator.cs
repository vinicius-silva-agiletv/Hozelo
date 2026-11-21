using FluentValidation;
using Hozelo.Application.UseCases.Person;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;
using Hozelo.Domain.Calculations;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.Expense;

/// <summary>
/// Regras comuns a registro e edição (data-model.md: Expense.Name, Expense.AmountType, Expense.TotalAmount,
/// Expense.InstallmentAmount, Expense.InstallmentsCount, Expense.FirstDueDate, Expense.Notes).
/// </summary>
public class ExpenseValidator : AbstractValidator<RequestUpdateExpenseJson>
{
    public const int NameMaxLength = 100;
    public const int NotesMaxLength = 500;
    public const int MaxInstallments = 480;
    public const decimal MaxTotalAmount = 9_999_999_999.99m;

    public ExpenseValidator()
    {
        RuleFor(r => r.Name)
            .NotEmpty().WithMessage(ResourceMessagesException.EXPENSE_NAME_EMPTY)
            .MaximumLength(NameMaxLength).WithMessage(ResourceMessagesException.EXPENSE_NAME_TOO_LONG);

        RuleFor(r => r.CategoryId)
            .GreaterThan(0).WithMessage(ResourceMessagesException.EXPENSE_CATEGORY_EMPTY);

        RuleFor(r => r.AmountType)
            .Must(t => t.HasValue && Enum.IsDefined(t.Value))
            .WithMessage(ResourceMessagesException.EXPENSE_AMOUNT_TYPE_INVALID);

        RuleFor(r => r.Amount)
            .GreaterThan(0).WithMessage(ResourceMessagesException.AMOUNT_MUST_BE_POSITIVE);

        When(r => r.Amount > 0, () =>
        {
            RuleFor(r => r.Amount)
                .Must(InstallmentCalculator.HasAtMostTwoDecimals)
                .WithMessage(ResourceMessagesException.AMOUNT_TOO_MANY_DECIMALS);
        });

        RuleFor(r => r.InstallmentsCount)
            .Equal(1).When(r => !r.IsInstallment)
            .WithMessage(ResourceMessagesException.SINGLE_PAYMENT_MUST_HAVE_ONE_INSTALLMENT);

        RuleFor(r => r.InstallmentsCount)
            .InclusiveBetween(2, MaxInstallments).When(r => r.IsInstallment)
            .WithMessage(ResourceMessagesException.INSTALLMENTS_COUNT_OUT_OF_RANGE);

        RuleFor(r => r.FirstDueDate)
            .NotNull().WithMessage(ResourceMessagesException.FIRST_DUE_DATE_EMPTY);

        RuleFor(r => r.Notes)
            .MaximumLength(NotesMaxLength).WithMessage(ResourceMessagesException.EXPENSE_NOTES_TOO_LONG);

        PersonMarkingRules.Add(this, r => r.PersonId, r => r.PersonPercent);

        // Regras que dependem de valor, tipo e quantidade válidos ao mesmo tempo.
        When(r => IsAmountValid(r) && IsCountValid(r) && r.AmountType.HasValue && Enum.IsDefined(r.AmountType.Value), () =>
        {
            RuleFor(r => r)
                .Must(r => TotalAmount(r) <= MaxTotalAmount)
                .WithName(nameof(RequestUpdateExpenseJson.Amount))
                .WithMessage(ResourceMessagesException.EXPENSE_TOTAL_TOO_HIGH);

            RuleFor(r => r)
                .Must(r => r.AmountType != AmountType.Total
                    || InstallmentCalculator.ToCents(r.Amount) >= r.InstallmentsCount)
                .WithName(nameof(RequestUpdateExpenseJson.Amount))
                .WithMessage(ResourceMessagesException.TOTAL_TOO_SMALL_FOR_INSTALLMENTS);
        });
    }

    private static bool IsAmountValid(RequestUpdateExpenseJson r) =>
        r.Amount > 0 && InstallmentCalculator.HasAtMostTwoDecimals(r.Amount);

    private static bool IsCountValid(RequestUpdateExpenseJson r) =>
        r.IsInstallment ? r.InstallmentsCount is >= 2 and <= MaxInstallments : r.InstallmentsCount == 1;

    private static decimal TotalAmount(RequestUpdateExpenseJson r) =>
        r.AmountType == AmountType.Installment ? r.Amount * r.InstallmentsCount : r.Amount;

    /// <summary>Nome sem espaços nas pontas; observação vazia vira null.</summary>
    public static void Normalize(RequestUpdateExpenseJson request)
    {
        request.Name = request.Name?.Trim() ?? string.Empty;
        request.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
    }
}
