using Hozelo.Domain.Entities;

namespace Hozelo.Application.Summaries;

/// <summary>Valores calculados de uma despesa a partir das parcelas (data-model.md, Valores calculados).</summary>
public sealed record ExpenseSummary(
    int PaidInstallments,
    int RemainingInstallments,
    decimal PaidAmount,
    decimal DiscountAmount,
    decimal RemainingAmount,
    bool IsPaid,
    DateOnly LastDueDate,
    DateOnly? NextDueDate)
{
    public static ExpenseSummary From(Expense expense)
    {
        var installments = expense.Installments.OrderBy(i => i.Number).ToList();
        var open = installments.Where(i => !i.IsPaid).ToList();
        var paid = installments.Where(i => i.IsPaid).ToList();

        return new ExpenseSummary(
            PaidInstallments: paid.Count,
            RemainingInstallments: open.Count,
            PaidAmount: paid.Sum(i => i.PaidAmount!.Value),
            DiscountAmount: paid.Sum(i => i.Discount),
            RemainingAmount: open.Sum(i => i.Amount),
            IsPaid: open.Count == 0,
            LastDueDate: installments.Count > 0 ? installments[^1].DueDate : expense.FirstDueDate,
            NextDueDate: open.Count > 0 ? open.Min(i => i.DueDate) : null);
    }
}
