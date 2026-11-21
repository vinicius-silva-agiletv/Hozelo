using CommonTestUtilities.Entities;
using CommonTestUtilities.Repositories;
using CommonTestUtilities.Services;
using Hozelo.Application.UseCases.Expense.PayInstallment;
using Hozelo.Application.UseCases.Expense.UndoInstallmentPayment;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;
using Hozelo.Domain.Entities;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Shouldly;

namespace UseCases.Tests.Expense.Payment;

public class InstallmentPaymentUseCasesTest
{
    private readonly Hozelo.Domain.Entities.User _user = UserBuilder.Build().user;

    [Fact]
    public async Task Pay_Defaults_To_Today()
    {
        var expense = ExpenseBuilder.Build(count: 3);

        var result = await Pay(expense).Execute(expense.Id, 2, null);

        var paid = result.Installments.Single(i => i.Number == 2);
        paid.IsPaid.ShouldBeTrue();
        paid.PaidOn.ShouldBe(CalendarBuilder.DefaultToday);
        result.PaidInstallments.ShouldBe(1);
    }

    [Fact]
    public async Task Pay_Last_Open_Installment_Settles_The_Expense()
    {
        var expense = ExpenseBuilder.Build(count: 3, alreadyPaid: 2);

        var result = await Pay(expense).Execute(expense.Id, 3, new RequestPayInstallmentJson { PaidOn = new DateOnly(2025, 3, 9) });

        result.Status.ShouldBe(ExpenseStatus.Paid);
        result.NextDueDate.ShouldBeNull();
    }

    [Fact]
    public async Task Pay_Error_Future_Date()
    {
        var expense = ExpenseBuilder.Build(count: 3);

        var act = () => Pay(expense).Execute(expense.Id, 1,
            new RequestPayInstallmentJson { PaidOn = CalendarBuilder.DefaultToday.AddDays(1) });

        (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages()
            .ShouldBe([ResourceMessagesException.PAID_ON_IN_FUTURE]);
    }

    [Fact]
    public async Task Pay_Error_Installment_Not_Found()
    {
        var expense = ExpenseBuilder.Build(count: 3);

        var act = () => Pay(expense).Execute(expense.Id, 4, null);

        (await act.ShouldThrowAsync<NotFoundException>()).Message.ShouldBe(ResourceMessagesException.INSTALLMENT_NOT_FOUND);
    }

    [Fact]
    public async Task Pay_Error_Expense_Not_Found()
    {
        var act = () => Pay(ExpenseBuilder.Build()).Execute(999, 1, null);

        (await act.ShouldThrowAsync<NotFoundException>()).Message.ShouldBe(ResourceMessagesException.EXPENSE_NOT_FOUND);
    }

    [Fact]
    public async Task Undo_Reopens_The_Installment()
    {
        var expense = ExpenseBuilder.Build(count: 3, alreadyPaid: 3);
        var repositories = new ExpenseRepositoryBuilder().WithExpense(expense);
        var useCase = new UndoInstallmentPaymentUseCase(
            LoggedUserBuilder.Build(_user), repositories.UpdateOnly.Object, repositories.ReadOnly.Object, UnitOfWorkBuilder.Build());

        var result = await useCase.Execute(expense.Id, 3);

        result.PaidInstallments.ShouldBe(2);
        result.Status.ShouldBe(ExpenseStatus.Open);
    }

    private PayInstallmentUseCase Pay(Hozelo.Domain.Entities.Expense expense)
    {
        _user.Id = expense.UserId;
        var repositories = new ExpenseRepositoryBuilder().WithExpense(expense);
        return new PayInstallmentUseCase(
            LoggedUserBuilder.Build(_user), repositories.UpdateOnly.Object, repositories.ReadOnly.Object,
            UnitOfWorkBuilder.Build(), CalendarBuilder.Build());
    }
}
