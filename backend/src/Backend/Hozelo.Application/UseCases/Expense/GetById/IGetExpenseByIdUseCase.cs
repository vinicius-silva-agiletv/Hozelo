using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Expense.GetById;

public interface IGetExpenseByIdUseCase
{
    Task<ResponseExpenseJson> Execute(long id);
}
