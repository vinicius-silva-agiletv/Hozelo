using CommonTestUtilities.Entities;
using CommonTestUtilities.Repositories;
using CommonTestUtilities.Services;
using Hozelo.Application.UseCases.Expense.GetAll;
using Hozelo.Domain.Enums;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Shouldly;

namespace UseCases.Tests.Expense.GetAll;

public class GetExpensesUseCaseTest
{
    private readonly Hozelo.Domain.Entities.Expense _car =
        ExpenseBuilder.Build(count: 48, alreadyPaid: 10, id: 1, name: "Carro");
    private readonly Hozelo.Domain.Entities.Expense _water =
        ExpenseBuilder.Build(AmountType.Total, 120m, 1, new DateOnly(2025, 6, 1), id: 2,
            category: CategoryBuilder.Build(2, "Água"), name: "Água");
    private readonly Hozelo.Domain.Entities.Expense _tv =
        ExpenseBuilder.Build(AmountType.Total, 900m, 3, new DateOnly(2024, 1, 1), alreadyPaid: 3, id: 3, name: "TV");

    [Fact]
    public async Task Orders_By_Next_Due_Date_With_Paid_Last()
    {
        var result = await UseCase().Execute(null, null);

        result.Expenses.Select(e => e.Name).ShouldBe(["Água", "Carro", "TV"]);
        result.TotalPaidAmount.ShouldBe(12500m + 900m);
        result.TotalRemainingAmount.ShouldBe(47500m + 120m);
    }

    [Fact]
    public async Task Filters_By_Status_And_Totals_Only_Listed()
    {
        var result = await UseCase().Execute(null, "paid");

        result.Expenses.Select(e => e.Name).ShouldBe(["TV"]);
        result.TotalRemainingAmount.ShouldBe(0m);
    }

    [Fact]
    public async Task Filters_By_Category()
    {
        var result = await UseCase().Execute(2, null);

        result.Expenses.Select(e => e.Name).ShouldBe(["Água"]);
    }

    [Theory]
    [InlineData("late")]
    [InlineData("1")]
    public async Task Error_Invalid_Status(string status)
    {
        var act = () => UseCase().Execute(null, status);

        (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages()
            .ShouldBe([ResourceMessagesException.EXPENSE_STATUS_INVALID]);
    }

    private GetExpensesUseCase UseCase()
    {
        var repositories = new ExpenseRepositoryBuilder().WithAll(_car, _water, _tv);
        return new GetExpensesUseCase(LoggedUserBuilder.Build(UserBuilder.Build().user), repositories.ReadOnly.Object);
    }
}
