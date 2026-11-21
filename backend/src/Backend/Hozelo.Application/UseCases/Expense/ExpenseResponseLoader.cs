using Hozelo.Application.Summaries;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories.Expense;

namespace Hozelo.Application.UseCases.Expense;

public static class ExpenseResponseLoader
{
    /// <summary>Relê a despesa gravada (com categoria e parcelas) e monta a resposta de detalhe.</summary>
    public static async Task<ResponseExpenseJson> Load(IExpenseReadOnlyRepository repository, long userId, long expenseId)
    {
        var expense = await repository.GetById(userId, expenseId);
        return ExpenseMapper.ToResponse(expense!);
    }
}
