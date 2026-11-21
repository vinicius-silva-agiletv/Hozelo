using Hozelo.Application.Summaries;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories.Expense;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Expense.GetAll;

public sealed class GetExpensesUseCase(
    ILoggedUser loggedUser,
    IExpenseReadOnlyRepository readOnlyRepository) : IGetExpensesUseCase
{
    public async Task<ResponseExpensesJson> Execute(long? categoryId, string? status)
    {
        var statusFilter = ParseStatus(status);

        var user = await loggedUser.User();

        var expenses = await readOnlyRepository.GetAll(user.Id, categoryId);

        var items = expenses
            .Select(e => (Expense: e, Summary: ExpenseSummary.From(e)))
            .Where(x => statusFilter is null || x.Summary.IsPaid == (statusFilter == ExpenseStatus.Paid))
            // Em aberto pelo próximo vencimento; quitadas por último.
            .OrderBy(x => x.Summary.IsPaid)
            .ThenBy(x => x.Summary.NextDueDate ?? DateOnly.MaxValue)
            .ThenBy(x => x.Expense.Name)
            .ToList();

        return new ResponseExpensesJson
        {
            TotalPaidAmount = items.Sum(x => x.Summary.PaidAmount),
            TotalRemainingAmount = items.Sum(x => x.Summary.RemainingAmount),
            TotalDiscountAmount = items.Sum(x => x.Summary.DiscountAmount),
            Expenses = items.Select(x => ExpenseMapper.ToShortResponse(x.Expense, x.Summary)).ToList()
        };
    }

    private static ExpenseStatus? ParseStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return null;

        if (!int.TryParse(status, out _)
            && Enum.TryParse<ExpenseStatus>(status, ignoreCase: true, out var parsed)
            && Enum.IsDefined(parsed))
            return parsed;

        throw new ErrorOnValidationException([ResourceMessagesException.EXPENSE_STATUS_INVALID]);
    }
}
