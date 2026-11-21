using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Expense.Register;

public interface IRegisterExpenseUseCase
{
    Task<ResponseExpenseJson> Execute(RequestRegisterExpenseJson request);
}
