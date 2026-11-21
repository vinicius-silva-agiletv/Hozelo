using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Expense;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Expense.Delete;

public sealed class DeleteExpenseUseCase(
    ILoggedUser loggedUser,
    IExpenseUpdateOnlyRepository updateOnlyRepository,
    IExpenseWriteOnlyRepository writeOnlyRepository,
    IUnitOfWork unitOfWork) : IDeleteExpenseUseCase
{
    public async Task Execute(long id)
    {
        var user = await loggedUser.User();

        var expense = await updateOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.EXPENSE_NOT_FOUND);

        // Parcelas removidas junto (cascade).
        writeOnlyRepository.Delete(expense);

        await unitOfWork.Commit();
    }
}
