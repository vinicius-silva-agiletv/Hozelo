using CommonTestUtilities.Entities;
using CommonTestUtilities.Repositories;
using CommonTestUtilities.Requests;
using CommonTestUtilities.Services;
using Hozelo.Application.UseCases.Expense.Register;
using Hozelo.Communication.Enums;
using Hozelo.Domain.Entities;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Microsoft.Extensions.Time.Testing;
using Moq;
using Shouldly;

namespace UseCases.Tests.Expense.Register;

public class RegisterExpenseUseCaseTest
{
    private readonly Hozelo.Domain.Entities.User _user = UserBuilder.Build().user;
    private readonly Hozelo.Domain.Entities.Category _category;

    public RegisterExpenseUseCaseTest() => _category = CategoryBuilder.Build(id: 3, userId: _user.Id);

    [Fact]
    public async Task Success_Total_Mode()
    {
        var (useCase, added) = Build();

        var result = await useCase.Execute(RequestRegisterExpenseJsonBuilder.Build(_category.Id));

        result.TotalAmount.ShouldBe(3000.00m);
        result.InstallmentAmount.ShouldBe(300.00m);
        result.Installments.Count.ShouldBe(10);
        result.LastDueDate.ShouldBe(new DateOnly(2027, 10, 5));
        result.Category.Name.ShouldBe(_category.Name);
        result.Status.ShouldBe(ExpenseStatus.Open);
        added().UserId.ShouldBe(_user.Id);
    }

    [Fact]
    public async Task Success_Installment_Mode_With_Already_Paid()
    {
        var (useCase, _) = Build();
        var request = RequestRegisterExpenseJsonBuilder.Installments(_category.Id, 1250m, 60, new DateOnly(2025, 1, 10), alreadyPaid: 24);

        var result = await useCase.Execute(request);

        result.TotalAmount.ShouldBe(75000.00m);
        result.PaidInstallments.ShouldBe(24);
        result.RemainingInstallments.ShouldBe(36);
        result.PaidAmount.ShouldBe(30000.00m);
        result.RemainingAmount.ShouldBe(45000.00m);
        result.Installments.Where(i => i.IsPaid).ShouldAllBe(i => i.PaidOn == i.DueDate);
    }

    [Fact]
    public async Task Success_Blank_Notes_Become_Null()
    {
        var (useCase, _) = Build();
        var request = RequestRegisterExpenseJsonBuilder.Build(_category.Id);
        request.Notes = "   ";

        var result = await useCase.Execute(request);

        result.Notes.ShouldBeNull();
    }

    [Fact]
    public async Task Error_Unknown_Category_Comes_With_Other_Errors()
    {
        var (useCase, _) = Build();
        var request = RequestRegisterExpenseJsonBuilder.Build(categoryId: 999);
        request.Name = "";

        var act = () => useCase.Execute(request);

        (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages().ShouldBe(
            [ResourceMessagesException.EXPENSE_NAME_EMPTY, ResourceMessagesException.EXPENSE_CATEGORY_NOT_EXISTS],
            ignoreOrder: true);
    }

    private (RegisterExpenseUseCase useCase, Func<Hozelo.Domain.Entities.Expense> added) Build()
    {
        var categories = new CategoryRepositoryBuilder().WithCategory(_category);
        var expenses = new ExpenseRepositoryBuilder();
        Hozelo.Domain.Entities.Expense? added = null;
        expenses.WriteOnly.Setup(r => r.Add(It.IsAny<Hozelo.Domain.Entities.Expense>()))
            .Callback<Hozelo.Domain.Entities.Expense>(e => added = e);

        var useCase = new RegisterExpenseUseCase(
            LoggedUserBuilder.Build(_user), categories.ReadOnly.Object, new Mock<Hozelo.Domain.Repositories.Person.IPersonReadOnlyRepository>().Object, expenses.WriteOnly.Object,
            UnitOfWorkBuilder.Build(), new FakeTimeProvider());

        return (useCase, () => added!);
    }
}
