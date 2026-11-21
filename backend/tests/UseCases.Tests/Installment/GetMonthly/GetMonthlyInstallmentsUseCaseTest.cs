using CommonTestUtilities.Entities;
using CommonTestUtilities.Services;
using Hozelo.Application.UseCases.Installment.GetMonthly;
using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.Installment;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Moq;
using Shouldly;

namespace UseCases.Tests.Installment.GetMonthly;

public class GetMonthlyInstallmentsUseCaseTest
{
    private readonly Mock<IInstallmentReadOnlyRepository> _repository = new();

    [Fact]
    public async Task Defaults_To_Current_Month_And_Sums_Totals()
    {
        var expense = ExpenseBuilder.Build(count: 48);
        var ordered = expense.Installments.OrderBy(i => i.Number).ToList();
        var open = ordered[22];
        var advance = ordered[47];
        advance.PayInAdvance(new DateOnly(2026, 11, 21), 1000m);
        _repository.Setup(r => r.GetByMonth(It.IsAny<long>(), new DateOnly(2026, 11, 1), new DateOnly(2026, 12, 1), null))
            .ReturnsAsync([advance, open]);

        var result = await UseCase().Execute(null, null, null);

        result.Year.ShouldBe(2026);
        result.Month.ShouldBe(11);
        result.PaidAmount.ShouldBe(1000m);
        result.OpenAmount.ShouldBe(1250m);
        result.TotalAmount.ShouldBe(2250m);
        result.Installments.Select(i => (i.Number, i.PaidInAdvance)).ShouldBe([(23, false), (48, true)]);
        result.Installments[0].InstallmentsCount.ShouldBe(48);
    }

    [Fact]
    public async Task Empty_Month_Has_Zero_Totals()
    {
        _repository.Setup(r => r.GetByMonth(It.IsAny<long>(), It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), It.IsAny<long?>()))
            .ReturnsAsync(new List<ExpenseInstallment>());

        var result = await UseCase().Execute(2030, 2, null);

        result.Installments.ShouldBeEmpty();
        result.TotalAmount.ShouldBe(0m);
    }

    [Theory]
    [InlineData(2026, null)]
    [InlineData(null, 5)]
    [InlineData(2026, 13)]
    [InlineData(2026, 0)]
    [InlineData(1999, 5)]
    [InlineData(2101, 5)]
    public async Task Error_Invalid_Month(int? year, int? month)
    {
        var act = () => UseCase().Execute(year, month, null);

        (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages()
            .ShouldBe([ResourceMessagesException.MONTH_INVALID]);
    }

    private GetMonthlyInstallmentsUseCase UseCase() =>
        new(LoggedUserBuilder.Build(UserBuilder.Build().user), _repository.Object, CalendarBuilder.Build());
}
