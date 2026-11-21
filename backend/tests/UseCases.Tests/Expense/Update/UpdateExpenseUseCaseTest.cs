using CommonTestUtilities.Entities;
using CommonTestUtilities.Repositories;
using CommonTestUtilities.Services;
using Hozelo.Application.UseCases.Expense.Delete;
using Hozelo.Application.UseCases.Expense.Update;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Moq;
using Shouldly;
using AmountType = Hozelo.Communication.Enums.AmountType;

namespace UseCases.Tests.Expense.Update;

public class UpdateExpenseUseCaseTest
{
    private readonly Hozelo.Domain.Entities.Category _otherCategory = CategoryBuilder.Build(7, "Outra");

    [Fact]
    public async Task Rename_And_Move_Keep_Installments()
    {
        var expense = ExpenseBuilder.Build(count: 10, alreadyPaid: 3);
        var installments = expense.Installments.ToList();
        var request = SameStructure(expense);
        request.Name = " Carro novo ";
        request.CategoryId = _otherCategory.Id;

        await UseCase(expense).Execute(expense.Id, request);

        expense.Name.ShouldBe("Carro novo");
        expense.CategoryId.ShouldBe(_otherCategory.Id);
        expense.Installments.ShouldBe(installments);
        expense.Installments.Count(i => i.IsPaid).ShouldBe(3);
    }

    [Fact]
    public async Task Structural_Change_Recalculates_Keeping_Paid()
    {
        var expense = ExpenseBuilder.Build(count: 10, alreadyPaid: 3);
        var request = SameStructure(expense);
        request.Amount = 1000m;
        request.InstallmentsCount = 12;

        await UseCase(expense).Execute(expense.Id, request);

        expense.TotalAmount.ShouldBe(12000m);
        expense.Installments.Count.ShouldBe(12);
        expense.Installments.Where(i => i.IsPaid).Select(i => i.Number).Order().ShouldBe([1, 2, 3]);
    }

    [Fact]
    public async Task Error_Fewer_Installments_Than_Paid()
    {
        var expense = ExpenseBuilder.Build(count: 10, alreadyPaid: 3);
        var request = SameStructure(expense);
        request.InstallmentsCount = 2;

        var act = () => UseCase(expense).Execute(expense.Id, request);

        (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages()
            .ShouldBe([ResourceMessagesException.PAID_INSTALLMENTS_EXCEED_COUNT]);
    }

    [Fact]
    public async Task Error_Structural_Change_With_Prepaid_Installments()
    {
        var expense = ExpenseBuilder.Build(count: 10);
        expense.Installments.OrderBy(i => i.Number).Last().PayInAdvance(new DateOnly(2025, 1, 1), 1000m);
        var request = SameStructure(expense);
        request.FirstDueDate = new DateOnly(2025, 2, 10);

        var act = () => UseCase(expense).Execute(expense.Id, request);

        (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages()
            .ShouldBe([ResourceMessagesException.UNDO_PREPAYMENTS_BEFORE_RESCHEDULE]);
    }

    [Fact]
    public async Task Rename_Allowed_With_Prepaid_Installments()
    {
        var expense = ExpenseBuilder.Build(count: 10);
        expense.Installments.OrderBy(i => i.Number).Last().PayInAdvance(new DateOnly(2025, 1, 1), 1000m);
        var request = SameStructure(expense);
        request.Name = "Outro nome";

        await UseCase(expense).Execute(expense.Id, request);

        expense.Name.ShouldBe("Outro nome");
    }

    [Fact]
    public async Task Error_Unknown_Category()
    {
        var expense = ExpenseBuilder.Build(count: 10);
        var request = SameStructure(expense);
        request.CategoryId = 555;

        var act = () => UseCase(expense).Execute(expense.Id, request);

        (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages()
            .ShouldBe([ResourceMessagesException.EXPENSE_CATEGORY_NOT_EXISTS]);
    }

    [Fact]
    public async Task Error_Not_Found()
    {
        var expense = ExpenseBuilder.Build(count: 10);

        var act = () => UseCase(expense).Execute(404, SameStructure(expense));

        await act.ShouldThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Delete_Success_And_Not_Found()
    {
        var expense = ExpenseBuilder.Build(count: 10);
        var repositories = new ExpenseRepositoryBuilder().WithExpense(expense);
        var useCase = new DeleteExpenseUseCase(
            LoggedUserBuilder.Build(User(expense)), repositories.UpdateOnly.Object, repositories.WriteOnly.Object, UnitOfWorkBuilder.Build());

        await useCase.Execute(expense.Id);
        var act = () => useCase.Execute(999);

        repositories.WriteOnly.Verify(r => r.Delete(expense));
        (await act.ShouldThrowAsync<NotFoundException>()).Message.ShouldBe(ResourceMessagesException.EXPENSE_NOT_FOUND);
    }

    private static RequestUpdateExpenseJson SameStructure(Hozelo.Domain.Entities.Expense expense) => new()
    {
        Name = expense.Name,
        CategoryId = expense.CategoryId,
        AmountType = (AmountType)(int)expense.AmountType,
        Amount = expense.InformedAmount,
        IsInstallment = expense.InstallmentsCount > 1,
        InstallmentsCount = expense.InstallmentsCount,
        FirstDueDate = expense.FirstDueDate
    };

    private static Hozelo.Domain.Entities.User User(Hozelo.Domain.Entities.Expense expense)
    {
        var user = UserBuilder.Build().user;
        user.Id = expense.UserId;
        return user;
    }

    private UpdateExpenseUseCase UseCase(Hozelo.Domain.Entities.Expense expense)
    {
        var categories = new CategoryRepositoryBuilder().WithCategory(expense.Category).WithCategory(_otherCategory);
        var repositories = new ExpenseRepositoryBuilder().WithExpense(expense);
        return new UpdateExpenseUseCase(
            LoggedUserBuilder.Build(User(expense)), categories.ReadOnly.Object, new Mock<Hozelo.Domain.Repositories.Person.IPersonReadOnlyRepository>().Object, repositories.UpdateOnly.Object,
            repositories.ReadOnly.Object, UnitOfWorkBuilder.Build());
    }
}
