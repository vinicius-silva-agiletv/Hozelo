using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Expense.UndoInstallmentPayment;

public interface IUndoInstallmentPaymentUseCase
{
    Task<ResponseExpenseJson> Execute(long expenseId, int number);
}
