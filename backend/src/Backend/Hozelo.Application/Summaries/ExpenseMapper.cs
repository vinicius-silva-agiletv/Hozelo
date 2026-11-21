using Hozelo.Communication.Enums;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Entities;

namespace Hozelo.Application.Summaries;

public static class ExpenseMapper
{
    public static ResponseExpenseJson ToResponse(Expense expense)
    {
        var response = new ResponseExpenseJson
        {
            Installments = expense.Installments
                .OrderBy(i => i.Number)
                .Select(i => new ResponseInstallmentJson
                {
                    Number = i.Number,
                    DueDate = i.DueDate,
                    Amount = i.Amount,
                    IsPaid = i.IsPaid,
                    PaidOn = i.PaidOn,
                    PaidAmount = i.PaidAmount,
                    Prepaid = i.Prepaid
                })
                .ToList()
        };

        Fill(response, expense, ExpenseSummary.From(expense));
        return response;
    }

    public static ResponseShortExpenseJson ToShortResponse(Expense expense, ExpenseSummary summary)
    {
        var response = new ResponseShortExpenseJson();
        Fill(response, expense, summary);
        return response;
    }

    public static ResponseCategorySummaryJson ToCategorySummary(Category category) =>
        new() { Id = category.Id, Name = category.Name };

    private static void Fill(ResponseShortExpenseJson response, Expense expense, ExpenseSummary summary)
    {
        response.Id = expense.Id;
        response.Name = expense.Name;
        response.Category = ToCategorySummary(expense.Category);
        response.AmountType = (AmountType)(int)expense.AmountType;
        response.TotalAmount = expense.TotalAmount;
        response.InstallmentAmount = expense.InstallmentAmount;
        response.IsInstallment = expense.InstallmentsCount > 1;
        response.InstallmentsCount = expense.InstallmentsCount;
        response.PaidInstallments = summary.PaidInstallments;
        response.RemainingInstallments = summary.RemainingInstallments;
        response.FirstDueDate = expense.FirstDueDate;
        response.LastDueDate = summary.LastDueDate;
        response.NextDueDate = summary.NextDueDate;
        response.PaidAmount = summary.PaidAmount;
        response.DiscountAmount = summary.DiscountAmount;
        response.RemainingAmount = summary.RemainingAmount;
        response.Status = summary.IsPaid ? ExpenseStatus.Paid : ExpenseStatus.Open;
        response.Notes = expense.Notes;
    }
}
