using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Expense.GetAll;

public interface IGetExpensesUseCase
{
    Task<ResponseExpensesJson> Execute(long? categoryId, string? status);
}
