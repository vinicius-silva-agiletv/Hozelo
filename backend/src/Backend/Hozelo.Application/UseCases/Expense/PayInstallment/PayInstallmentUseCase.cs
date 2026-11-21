using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Expense;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Expense.PayInstallment;

public sealed class PayInstallmentUseCase(
    ILoggedUser loggedUser,
    IExpenseUpdateOnlyRepository updateOnlyRepository,
    IExpenseReadOnlyRepository readOnlyRepository,
    IUnitOfWork unitOfWork,
    ICalendar calendar) : IPayInstallmentUseCase
{
    public async Task<ResponseExpenseJson> Execute(long expenseId, int number, RequestPayInstallmentJson? request)
    {
        var user = await loggedUser.User();

        var expense = await updateOnlyRepository.GetById(user.Id, expenseId)
            ?? throw new NotFoundException(ResourceMessagesException.EXPENSE_NOT_FOUND);

        var installment = expense.Installments.FirstOrDefault(i => i.Number == number)
            ?? throw new NotFoundException(ResourceMessagesException.INSTALLMENT_NOT_FOUND);

        var today = calendar.Today();
        var paidOn = request?.PaidOn ?? today;

        if (paidOn > today)
            throw new ErrorOnValidationException([ResourceMessagesException.PAID_ON_IN_FUTURE]);

        installment.Pay(paidOn);

        await unitOfWork.Commit();

        return await ExpenseResponseLoader.Load(readOnlyRepository, user.Id, expenseId);
    }
}
