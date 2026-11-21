using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Calculations;
using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Expense;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Expense.Amortize;

public sealed class AmortizeExpenseUseCase(
    ILoggedUser loggedUser,
    IExpenseUpdateOnlyRepository updateOnlyRepository,
    IExpenseReadOnlyRepository readOnlyRepository,
    IUnitOfWork unitOfWork,
    ICalendar calendar) : IAmortizeExpenseUseCase
{
    public async Task<ResponseExpenseJson> Execute(long expenseId, RequestAmortizeExpenseJson request)
    {
        var user = await loggedUser.User();

        var expense = await updateOnlyRepository.GetById(user.Id, expenseId)
            ?? throw new NotFoundException(ResourceMessagesException.EXPENSE_NOT_FOUND);

        var today = calendar.Today();
        var paidOn = request.PaidOn ?? today;

        var errors = new AmortizeExpenseValidator().Validate(request).Messages();
        if (paidOn > today)
            errors.Add(ResourceMessagesException.PAID_ON_IN_FUTURE);
        ValidationErrors.ThrowIfAny(errors);

        var selected = SelectInstallments(expense, request);

        var selectedTotal = selected.Sum(i => i.Amount);
        if (request.PaidAmount > selectedTotal)
            throw new ErrorOnValidationException([ResourceMessagesException.PAID_AMOUNT_EXCEEDS_SELECTED]);

        var shares = InstallmentCalculator.DistributePayment(selected.Select(i => i.Amount).ToList(), request.PaidAmount);
        if (shares.Any(s => s <= 0))
            throw new ErrorOnValidationException([ResourceMessagesException.PAID_AMOUNT_TOO_SMALL]);

        for (var i = 0; i < selected.Count; i++)
            selected[i].PayInAdvance(paidOn, shares[i]);

        await unitOfWork.Commit();

        return await ExpenseResponseLoader.Load(readOnlyRepository, user.Id, expenseId);
    }

    /// <summary>Por quantidade: as últimas em aberto. Por números: qualquer conjunto de parcelas em aberto.</summary>
    private static List<ExpenseInstallment> SelectInstallments(Domain.Entities.Expense expense, RequestAmortizeExpenseJson request)
    {
        var open = expense.Installments.Where(i => !i.IsPaid).OrderBy(i => i.Number).ToList();

        if (request.Quantity is int quantity)
        {
            if (quantity < 1 || quantity > open.Count)
                throw new ErrorOnValidationException([ResourceMessagesException.AMORTIZATION_QUANTITY_INVALID]);

            return open.TakeLast(quantity).ToList();
        }

        var numbers = request.InstallmentNumbers!;
        var selected = open.Where(i => numbers.Contains(i.Number)).ToList();

        if (numbers.Distinct().Count() != numbers.Count || selected.Count != numbers.Count)
            throw new ErrorOnValidationException([ResourceMessagesException.AMORTIZATION_INSTALLMENTS_INVALID]);

        return selected;
    }
}
