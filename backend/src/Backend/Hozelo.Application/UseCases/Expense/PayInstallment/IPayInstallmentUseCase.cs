using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Expense.PayInstallment;

public interface IPayInstallmentUseCase
{
    Task<ResponseExpenseJson> Execute(long expenseId, int number, RequestPayInstallmentJson? request);
}
