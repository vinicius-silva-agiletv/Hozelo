using CommonTestUtilities.Entities;
using CommonTestUtilities.Repositories;
using CommonTestUtilities.Services;
using Hozelo.Application.UseCases.Expense.Amortize;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Shouldly;

namespace UseCases.Tests.Expense.Amortize;

public class AmortizeExpenseUseCaseTest
{
    [Fact]
    public async Task Quantity_Selects_The_Last_Open_Installments()
    {
        var expense = ExpenseBuilder.Build(count: 48, alreadyPaid: 10);

        var result = await UseCase(expense).Execute(expense.Id, new RequestAmortizeExpenseJson { Quantity = 6, PaidAmount = 6000m });

        result.Installments.Where(i => i.Prepaid).Select(i => i.Number).ShouldBe([43, 44, 45, 46, 47, 48]);
        result.Installments.Where(i => i.Prepaid).ShouldAllBe(i => i.PaidAmount == 1000m && i.PaidOn == CalendarBuilder.DefaultToday);
        result.RemainingInstallments.ShouldBe(32);
        result.DiscountAmount.ShouldBe(1500m);
        (result.PaidAmount + result.DiscountAmount + result.RemainingAmount).ShouldBe(result.TotalAmount);
    }

    [Fact]
    public async Task Numbers_Accept_Any_Open_Installments()
    {
        var expense = ExpenseBuilder.Build(count: 10);

        var result = await UseCase(expense).Execute(expense.Id,
            new RequestAmortizeExpenseJson { InstallmentNumbers = [1, 2], PaidAmount = 2500m });

        result.Installments.Where(i => i.IsPaid).Select(i => i.Number).ShouldBe([1, 2]);
        result.DiscountAmount.ShouldBe(0m);
    }

    [Fact]
    public async Task Covering_All_Open_Installments_Settles_The_Expense()
    {
        var expense = ExpenseBuilder.Build(count: 3, alreadyPaid: 1);

        var result = await UseCase(expense).Execute(expense.Id, new RequestAmortizeExpenseJson { Quantity = 2, PaidAmount = 2000m });

        result.Status.ShouldBe(ExpenseStatus.Paid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(39)]
    public async Task Error_Invalid_Quantity(int quantity)
    {
        var expense = ExpenseBuilder.Build(count: 48, alreadyPaid: 10);

        await ShouldFail(expense, new() { Quantity = quantity, PaidAmount = 10m }, ResourceMessagesException.AMORTIZATION_QUANTITY_INVALID);
    }

    [Theory]
    [InlineData(new[] { 1 })]
    [InlineData(new[] { 20, 20 })]
    [InlineData(new[] { 49 })]
    public async Task Error_Paid_Repeated_Or_Unknown_Installments(int[] numbers)
    {
        var expense = ExpenseBuilder.Build(count: 48, alreadyPaid: 10);

        await ShouldFail(expense, new() { InstallmentNumbers = numbers, PaidAmount = 10m },
            ResourceMessagesException.AMORTIZATION_INSTALLMENTS_INVALID);
    }

    [Fact]
    public async Task Error_Paid_More_Than_The_Selected_Sum()
    {
        var expense = ExpenseBuilder.Build(count: 48);

        await ShouldFail(expense, new() { Quantity = 2, PaidAmount = 2500.01m }, ResourceMessagesException.PAID_AMOUNT_EXCEEDS_SELECTED);
    }

    [Fact]
    public async Task Error_Future_Date()
    {
        var expense = ExpenseBuilder.Build(count: 48);

        await ShouldFail(expense, new() { Quantity = 1, PaidAmount = 10m, PaidOn = CalendarBuilder.DefaultToday.AddDays(1) },
            ResourceMessagesException.PAID_ON_IN_FUTURE);
    }

    [Fact]
    public async Task Error_Paid_Amount_Too_Small_For_The_Selection()
    {
        var expense = ExpenseBuilder.Build(count: 48);

        await ShouldFail(expense, new() { Quantity = 3, PaidAmount = 0.02m }, ResourceMessagesException.PAID_AMOUNT_TOO_SMALL);
    }

    private static async Task ShouldFail(Hozelo.Domain.Entities.Expense expense, RequestAmortizeExpenseJson request, string message)
    {
        var act = () => UseCase(expense).Execute(expense.Id, request);

        (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages().ShouldBe([message]);
        expense.Installments.Where(i => i.Prepaid).ShouldBeEmpty();
    }

    private static AmortizeExpenseUseCase UseCase(Hozelo.Domain.Entities.Expense expense)
    {
        var user = UserBuilder.Build().user;
        user.Id = expense.UserId;
        var repositories = new ExpenseRepositoryBuilder().WithExpense(expense);
        return new AmortizeExpenseUseCase(
            LoggedUserBuilder.Build(user), repositories.UpdateOnly.Object, repositories.ReadOnly.Object,
            UnitOfWorkBuilder.Build(), CalendarBuilder.Build());
    }
}
