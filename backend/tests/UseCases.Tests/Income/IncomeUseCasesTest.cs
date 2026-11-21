using CommonTestUtilities.Entities;
using CommonTestUtilities.Repositories;
using CommonTestUtilities.Requests;
using CommonTestUtilities.Services;
using Hozelo.Application.UseCases.Income.Receive;
using Hozelo.Application.UseCases.Income.Register;
using Hozelo.Communication.Requests;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories.Income;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Microsoft.Extensions.Time.Testing;
using Moq;
using Shouldly;

namespace UseCases.Tests.Income;

public class IncomeUseCasesTest
{
    private readonly Hozelo.Domain.Entities.User _user = UserBuilder.Build().user;
    private readonly Hozelo.Domain.Entities.Category _incomeCategory;
    private readonly Hozelo.Domain.Entities.Category _expenseCategory;

    public IncomeUseCasesTest()
    {
        _user.Id = 1;
        _incomeCategory = CategoryBuilder.Build(8, "13º salário", type: CategoryType.Income);
        _expenseCategory = CategoryBuilder.Build(3, "Carro");
    }

    [Fact]
    public async Task Register_Already_Received()
    {
        var request = RequestIncomeJsonBuilder.Build(_incomeCategory.Id);
        request.ReceivedOn = CalendarBuilder.DefaultToday;

        var result = await Register().Execute(request);

        result.IsReceived.ShouldBeTrue();
        result.Category.Name.ShouldBe("13º salário");
    }

    [Fact]
    public async Task Register_Error_Expense_Category_And_Future_Receipt_Together()
    {
        var request = RequestIncomeJsonBuilder.Build(_expenseCategory.Id);
        request.ReceivedOn = CalendarBuilder.DefaultToday.AddDays(1);

        var act = () => Register().Execute(request);

        (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages().ShouldBe(
            [ResourceMessagesException.DATE_IN_FUTURE, ResourceMessagesException.CATEGORY_NOT_INCOME], ignoreOrder: true);
    }

    [Fact]
    public async Task Receive_Defaults_To_Today_And_Undo()
    {
        var income = IncomeBuilder.Build(category: _incomeCategory);
        var useCase = Receive(income);

        (await useCase.Execute(income.Id, null)).ReceivedOn.ShouldBe(CalendarBuilder.DefaultToday);
        (await useCase.Undo(income.Id)).IsReceived.ShouldBeFalse();
    }

    [Fact]
    public async Task Receive_Errors()
    {
        var income = IncomeBuilder.Build(category: _incomeCategory);
        var useCase = Receive(income);

        var future = () => useCase.Execute(income.Id, new RequestReceiveIncomeJson { ReceivedOn = CalendarBuilder.DefaultToday.AddDays(1) });
        var missing = () => useCase.Execute(999, null);

        (await future.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages().ShouldBe([ResourceMessagesException.DATE_IN_FUTURE]);
        (await missing.ShouldThrowAsync<NotFoundException>()).Message.ShouldBe(ResourceMessagesException.INCOME_NOT_FOUND);
    }

    private RegisterIncomeUseCase Register()
    {
        var categories = new CategoryRepositoryBuilder().WithCategory(_incomeCategory).WithCategory(_expenseCategory);
        return new RegisterIncomeUseCase(LoggedUserBuilder.Build(_user), categories.ReadOnly.Object,
            new Mock<IIncomeWriteOnlyRepository>().Object, UnitOfWorkBuilder.Build(), CalendarBuilder.Build(), new FakeTimeProvider());
    }

    private ReceiveIncomeUseCase Receive(Hozelo.Domain.Entities.Income income)
    {
        var update = new Mock<IIncomeUpdateOnlyRepository>();
        update.Setup(r => r.GetById(1, income.Id)).ReturnsAsync(income);
        var read = new Mock<IIncomeReadOnlyRepository>();
        read.Setup(r => r.GetById(1, income.Id)).ReturnsAsync(income);

        return new ReceiveIncomeUseCase(LoggedUserBuilder.Build(_user), update.Object, read.Object, UnitOfWorkBuilder.Build(), CalendarBuilder.Build());
    }
}
