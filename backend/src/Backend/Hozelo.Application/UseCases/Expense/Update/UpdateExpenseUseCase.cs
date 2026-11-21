using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Domain.Repositories.Expense;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Expense.Update;

public sealed class UpdateExpenseUseCase(
    ILoggedUser loggedUser,
    ICategoryReadOnlyRepository categoryRepository,
    IExpenseUpdateOnlyRepository updateOnlyRepository,
    IExpenseReadOnlyRepository readOnlyRepository,
    IUnitOfWork unitOfWork) : IUpdateExpenseUseCase
{
    public async Task<ResponseExpenseJson> Execute(long id, RequestUpdateExpenseJson request)
    {
        var user = await loggedUser.User();

        var expense = await updateOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.EXPENSE_NOT_FOUND);

        ExpenseValidator.Normalize(request);

        var errors = new ExpenseValidator().Validate(request).Messages();

        if (request.CategoryId > 0 && await categoryRepository.GetById(user.Id, request.CategoryId) is null)
            errors.Add(ResourceMessagesException.EXPENSE_CATEGORY_NOT_EXISTS);

        ValidationErrors.ThrowIfAny(errors);

        var amountType = (AmountType)(int)request.AmountType!.Value;
        var firstDueDate = request.FirstDueDate!.Value;

        var structuralChange = amountType != expense.AmountType
            || request.Amount != expense.InformedAmount
            || request.InstallmentsCount != expense.InstallmentsCount
            || firstDueDate != expense.FirstDueDate;

        if (structuralChange)
        {
            // Regras de recálculo (research.md §11).
            if (expense.Installments.Any(i => i.Prepaid))
                throw new ErrorOnValidationException([ResourceMessagesException.UNDO_PREPAYMENTS_BEFORE_RESCHEDULE]);

            if (request.InstallmentsCount < expense.Installments.Count(i => i.IsPaid))
                throw new ErrorOnValidationException([ResourceMessagesException.PAID_INSTALLMENTS_EXCEED_COUNT]);

            expense.Reschedule(amountType, request.Amount, request.InstallmentsCount, firstDueDate);
        }

        expense.Name = request.Name;
        expense.CategoryId = request.CategoryId;
        expense.Notes = request.Notes;

        await unitOfWork.Commit();

        return await ExpenseResponseLoader.Load(readOnlyRepository, user.Id, id);
    }
}
