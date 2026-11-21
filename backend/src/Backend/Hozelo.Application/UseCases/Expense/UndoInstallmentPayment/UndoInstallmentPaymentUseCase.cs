using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Expense;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Expense.UndoInstallmentPayment;

public sealed class UndoInstallmentPaymentUseCase(
    ILoggedUser loggedUser,
    IExpenseUpdateOnlyRepository updateOnlyRepository,
    IExpenseReadOnlyRepository readOnlyRepository,
    IUnitOfWork unitOfWork) : IUndoInstallmentPaymentUseCase
{
    public async Task<ResponseExpenseJson> Execute(long expenseId, int number)
    {
        var user = await loggedUser.User();

        var expense = await updateOnlyRepository.GetById(user.Id, expenseId)
            ?? throw new NotFoundException(ResourceMessagesException.EXPENSE_NOT_FOUND);

        var installment = expense.Installments.FirstOrDefault(i => i.Number == number)
            ?? throw new NotFoundException(ResourceMessagesException.INSTALLMENT_NOT_FOUND);

        installment.UndoPayment();

        await unitOfWork.Commit();

        return await ExpenseResponseLoader.Load(readOnlyRepository, user.Id, expenseId);
    }
}
