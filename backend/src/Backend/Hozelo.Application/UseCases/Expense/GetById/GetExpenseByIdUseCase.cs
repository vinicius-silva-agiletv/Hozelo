using Hozelo.Application.Summaries;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories.Expense;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Expense.GetById;

public sealed class GetExpenseByIdUseCase(
    ILoggedUser loggedUser,
    IExpenseReadOnlyRepository readOnlyRepository) : IGetExpenseByIdUseCase
{
    public async Task<ResponseExpenseJson> Execute(long id)
    {
        var user = await loggedUser.User();

        var expense = await readOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.EXPENSE_NOT_FOUND);

        return ExpenseMapper.ToResponse(expense);
    }
}
