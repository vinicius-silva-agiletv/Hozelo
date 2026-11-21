using CommonTestUtilities.Entities;
using CommonTestUtilities.Repositories;
using CommonTestUtilities.Requests;
using CommonTestUtilities.Services;
using Hozelo.Application.UseCases.Recurrence.Months;
using Hozelo.Application.UseCases.Recurrence.Period;
using Hozelo.Application.UseCases.Recurrence.Register;
using Hozelo.Communication.Requests;
using Hozelo.Domain.Entities;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories.Recurrence;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Microsoft.Extensions.Time.Testing;
using Moq;
using Shouldly;

namespace UseCases.Tests.Recurrence;

public class RecurrenceUseCasesTest
{
    private readonly Hozelo.Domain.Entities.User _user = UserBuilder.Build().user;
    private readonly RecurringEntry _entry = RecurringEntryBuilder.Build();

    public RecurrenceUseCasesTest() => _user.Id = 1;

    [Fact]
    public async Task Register_Validates_Category_Type_By_Kind()
    {
        var categories = new CategoryRepositoryBuilder()
            .WithCategory(CategoryBuilder.Build(3, "Carro"))
            .WithCategory(CategoryBuilder.Build(9, "Salário", type: CategoryType.Income));
        var useCase = new RegisterRecurrenceUseCase(LoggedUserBuilder.Build(_user), categories.ReadOnly.Object,
            new Mock<IRecurrenceWriteOnlyRepository>().Object, UnitOfWorkBuilder.Build(), CalendarBuilder.Build(), new FakeTimeProvider());

        var salary = await useCase.Execute(RequestRecurrenceJsonBuilder.Salary(9));
        var wrongSalary = () => useCase.Execute(RequestRecurrenceJsonBuilder.Salary(3));
        var wrongBill = () => useCase.Execute(RequestRecurrenceJsonBuilder.Bill(9));

        salary.CurrentAmount.ShouldBe(6000m);
        salary.Amounts.Single().FromMonth.ShouldBe("2026-01");
        (await wrongSalary.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages().ShouldBe([ResourceMessagesException.CATEGORY_NOT_INCOME]);
        (await wrongBill.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages().ShouldBe([ResourceMessagesException.CATEGORY_NOT_EXPENSE]);
    }

    [Fact]
    public async Task Adjust_Errors()
    {
        _entry.SettleMonth(new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 5));

        await ShouldFail(() => Months().Adjust(1, 2025, 12, new RequestAdjustRecurrenceMonthJson { Amount = 10 }), ResourceMessagesException.MONTH_OUT_OF_PERIOD);
        await ShouldFail(() => Months().Adjust(1, 2026, 11, new RequestAdjustRecurrenceMonthJson { Skipped = true }), ResourceMessagesException.UNDO_SETTLEMENT_BEFORE_SKIP);
        await ShouldFail(() => Months().Adjust(1, 2026, 13, new RequestAdjustRecurrenceMonthJson { Amount = 10 }), ResourceMessagesException.MONTH_INVALID);
    }

    [Fact]
    public async Task Adjust_Settled_Month_Amount_Is_Allowed()
    {
        _entry.SettleMonth(new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 5));

        var result = await Months().Adjust(1, 2026, 11, new RequestAdjustRecurrenceMonthJson { Amount = 5900 });

        result.Months.Single().Amount.ShouldBe(5900m);
        result.Months.Single().SettledOn.ShouldBe(new DateOnly(2026, 11, 5));
    }

    [Fact]
    public async Task Settle_Errors_And_Default_Date()
    {
        _entry.SkipMonth(new DateOnly(2026, 10, 1));

        await ShouldFail(() => Months().Settle(1, 2026, 10, null), ResourceMessagesException.MONTH_SKIPPED);
        await ShouldFail(() => Months().Settle(1, 2025, 10, null), ResourceMessagesException.MONTH_OUT_OF_PERIOD);
        await ShouldFail(() => Months().Settle(1, 2026, 11, new RequestSettleRecurrenceMonthJson { SettledOn = CalendarBuilder.DefaultToday.AddDays(1) }),
            ResourceMessagesException.DATE_IN_FUTURE);

        var result = await Months().Settle(1, 2026, 11, null);
        result.Months.Single(m => m.Month == "2026-11").SettledOn.ShouldBe(CalendarBuilder.DefaultToday);
    }

    [Fact]
    public async Task End_Errors_And_Reopen()
    {
        _entry.SettleMonth(new DateOnly(2027, 2, 1), new DateOnly(2026, 11, 20));

        await ShouldFail(() => Period().End(1, new RequestEndRecurrenceJson { EndMonth = "2025-12" }), ResourceMessagesException.END_BEFORE_START);
        await ShouldFail(() => Period().End(1, new RequestEndRecurrenceJson { EndMonth = "2027-01" }), ResourceMessagesException.SETTLED_AFTER_END);
        await ShouldFail(() => Period().End(1, new RequestEndRecurrenceJson { EndMonth = "jan" }), ResourceMessagesException.MONTH_FORMAT_INVALID);

        (await Period().End(1, new RequestEndRecurrenceJson { EndMonth = "2027-06" })).EndMonth.ShouldBe("2027-06");
        (await Period().Reopen(1)).EndMonth.ShouldBeNull();
    }

    [Fact]
    public async Task Change_Amount_Outside_Period_And_Not_Found()
    {
        await ShouldFail(() => Period().ChangeAmount(1, new RequestChangeRecurrenceAmountJson { Amount = 10, FromMonth = "2025-01" }),
            ResourceMessagesException.MONTH_OUT_OF_PERIOD);

        var act = () => Period().Reopen(999);
        (await act.ShouldThrowAsync<NotFoundException>()).Message.ShouldBe(ResourceMessagesException.RECURRENCE_NOT_FOUND);
    }

    private static async Task ShouldFail(Func<Task> act, string message) =>
        (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages().ShouldBe([message]);

    private (Mock<IRecurrenceUpdateOnlyRepository>, Mock<IRecurrenceReadOnlyRepository>) Repositories()
    {
        var update = new Mock<IRecurrenceUpdateOnlyRepository>();
        update.Setup(r => r.GetById(1, 1)).ReturnsAsync(_entry);
        var read = new Mock<IRecurrenceReadOnlyRepository>();
        read.Setup(r => r.GetById(1, 1)).ReturnsAsync(_entry);
        return (update, read);
    }

    private RecurrenceMonthUseCase Months()
    {
        var (update, read) = Repositories();
        return new RecurrenceMonthUseCase(LoggedUserBuilder.Build(_user), update.Object, read.Object, UnitOfWorkBuilder.Build(), CalendarBuilder.Build());
    }

    private RecurrencePeriodUseCase Period()
    {
        var (update, read) = Repositories();
        return new RecurrencePeriodUseCase(LoggedUserBuilder.Build(_user), update.Object, read.Object, UnitOfWorkBuilder.Build(), CalendarBuilder.Build());
    }
}
