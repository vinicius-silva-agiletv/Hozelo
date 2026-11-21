using CommonTestUtilities.Entities;
using CommonTestUtilities.Services;
using Hozelo.Application.UseCases.Summary.GetMonthly;
using Hozelo.Communication.Enums;
using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.Income;
using Hozelo.Domain.Repositories.Installment;
using Hozelo.Domain.Repositories.OpeningBalance;
using Hozelo.Domain.Repositories.Recurrence;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Moq;
using Shouldly;

namespace UseCases.Tests.Summary;

public class GetMonthlySummaryUseCaseTest
{
    private readonly Mock<IInstallmentReadOnlyRepository> _installments = new();
    private readonly Mock<IIncomeReadOnlyRepository> _incomes = new();
    private readonly Mock<IRecurrenceReadOnlyRepository> _recurrences = new();
    private readonly Mock<IOpeningBalanceRepository> _opening = new();

    public GetMonthlySummaryUseCaseTest()
    {
        _installments.Setup(r => r.GetByRange(It.IsAny<long>(), It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), It.IsAny<long?>()))
            .ReturnsAsync(new List<ExpenseInstallment>());
        _incomes.Setup(r => r.GetAll(It.IsAny<long>(), It.IsAny<long?>(), It.IsAny<DateOnly?>(), It.IsAny<DateOnly?>()))
            .ReturnsAsync(new List<Hozelo.Domain.Entities.Income>());
        _recurrences.Setup(r => r.GetAll(It.IsAny<long>(), It.IsAny<Hozelo.Domain.Enums.EntryKind?>(), It.IsAny<long?>()))
            .ReturnsAsync(new List<RecurringEntry>());
    }

    [Fact]
    public async Task Combines_The_Three_Sources()
    {
        var expense = ExpenseBuilder.Build(count: 48);
        var ordered = expense.Installments.OrderBy(i => i.Number).ToList();
        ordered[47].PayInAdvance(new DateOnly(2026, 11, 21), 1000m);
        _installments.Setup(r => r.GetByRange(It.IsAny<long>(), It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), null))
            .ReturnsAsync([ordered[22], ordered[47]]);
        _incomes.Setup(r => r.GetAll(It.IsAny<long>(), null, It.IsAny<DateOnly?>(), It.IsAny<DateOnly?>()))
            .ReturnsAsync([IncomeBuilder.Build(expectedDate: new DateOnly(2026, 11, 30))]);
        _recurrences.Setup(r => r.GetAll(It.IsAny<long>(), null, null)).ReturnsAsync([RecurringEntryBuilder.Build()]);

        var result = await UseCase().Execute(null, null, null);

        result.Incomes.Select(i => (i.Source, i.Amount)).ShouldBe([(LedgerSource.Recurrence, 6000m), (LedgerSource.Income, 2500m)]);
        result.Expenses.Select(e => (e.Number, e.Amount, e.PaidInAdvance)).ShouldBe([(23, 1250m, false), (48, 1000m, true)]);
        result.Forecast.Balance.ShouldBe(8500m - 2250m);
        result.Realized.Paid.ShouldBe(1000m);
        result.OpeningBalanceMissing.ShouldBeTrue();
        result.Accumulated.ShouldBeNull();
        result.Pending.ShouldBeNull();
    }

    [Fact]
    public async Task With_Opening_Balance_Has_Accumulated_And_Pending_In_Current_Month()
    {
        _opening.Setup(r => r.Get(It.IsAny<long>())).ReturnsAsync(new OpeningBalance { Amount = 3200m, ReferenceDate = new DateOnly(2026, 10, 1) });
        _recurrences.Setup(r => r.GetAll(It.IsAny<long>(), null, null)).ReturnsAsync([RecurringEntryBuilder.Build(startMonth: new DateOnly(2026, 10, 1))]);

        var current = await UseCase().Execute(null, null, null);
        var next = await UseCase().Execute(2026, 12, null);

        current.Pending!.ToReceive.ShouldBe(6000m);
        current.Accumulated!.PreviousBalance.ShouldBe(3200m);
        current.Accumulated.EndBalance.ShouldBe(3200m + 6000m + 6000m);
        next.Pending.ShouldBeNull();
        next.Accumulated!.PreviousBalance.ShouldBe(current.Accumulated.EndBalance);
    }

    [Fact]
    public async Task Category_Filter_Has_No_Accumulated()
    {
        _opening.Setup(r => r.Get(It.IsAny<long>())).ReturnsAsync(new OpeningBalance { Amount = 1m, ReferenceDate = new DateOnly(2026, 1, 1) });

        var result = await UseCase().Execute(null, null, 5);

        result.Accumulated.ShouldBeNull();
        result.Pending.ShouldBeNull();
        result.OpeningBalanceMissing.ShouldBeFalse();
        _opening.Verify(r => r.Get(It.IsAny<long>()), Times.Never);
    }

    [Theory]
    [InlineData(2026, null)]
    [InlineData(2026, 13)]
    [InlineData(1999, 1)]
    public async Task Error_Invalid_Month(int? year, int? month)
    {
        var act = () => UseCase().Execute(year, month, null);

        (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages().ShouldBe([ResourceMessagesException.MONTH_INVALID]);
    }

    private GetMonthlySummaryUseCase UseCase() => new(
        LoggedUserBuilder.Build(UserBuilder.Build().user), _installments.Object, _incomes.Object, _recurrences.Object,
        _opening.Object, CalendarBuilder.Build());
}
