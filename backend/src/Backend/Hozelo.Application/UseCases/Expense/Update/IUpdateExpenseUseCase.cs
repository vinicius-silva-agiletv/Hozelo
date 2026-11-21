using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Expense.Update;

public interface IUpdateExpenseUseCase
{
    Task<ResponseExpenseJson> Execute(long id, RequestUpdateExpenseJson request);
}
