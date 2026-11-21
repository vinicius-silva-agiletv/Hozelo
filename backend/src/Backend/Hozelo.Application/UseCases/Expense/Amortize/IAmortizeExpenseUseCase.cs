using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Expense.Amortize;

public interface IAmortizeExpenseUseCase
{
    Task<ResponseExpenseJson> Execute(long expenseId, RequestAmortizeExpenseJson request);
}
