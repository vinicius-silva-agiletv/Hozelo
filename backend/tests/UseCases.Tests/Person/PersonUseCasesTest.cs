using CommonTestUtilities.Entities;
using CommonTestUtilities.Repositories;
using CommonTestUtilities.Requests;
using CommonTestUtilities.Services;
using Hozelo.Application.UseCases.Person;
using Hozelo.Application.UseCases.Person.Entries;
using Hozelo.Domain.Calculations;
using Hozelo.Domain.Entities;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories.Person;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Microsoft.Extensions.Time.Testing;
using Moq;
using Shouldly;

namespace UseCases.Tests.Person;

public class PersonUseCasesTest
{
    private readonly Hozelo.Domain.Entities.User _user = UserBuilder.Build().user;
    private readonly Mock<IPersonReadOnlyRepository> _read = new();
    private readonly Mock<IPersonUpdateOnlyRepository> _update = new();
    private readonly Mock<IPersonLedgerLoader> _ledger = new();
    private readonly Hozelo.Domain.Entities.Person _sogro = new() { Id = 2, UserId = 1, Name = "Sogro" };

    public PersonUseCasesTest()
    {
        _user.Id = 1;
        _read.Setup(r => r.GetById(1, 2)).ReturnsAsync(_sogro);
        _update.Setup(r => r.GetById(1, 2)).ReturnsAsync(_sogro);
    }

    [Fact]
    public async Task Register_Error_Duplicated_Name()
    {
        _read.Setup(r => r.ExistsWithName(1, "Sogro", null)).ReturnsAsync(true);

        var act = () => People().Register(RequestPersonJsonBuilder.Build(" Sogro "));

        (await act.ShouldThrowAsync<ConflictException>()).Message.ShouldBe(ResourceMessagesException.PERSON_NAME_ALREADY_EXISTS);
    }

    [Fact]
    public async Task Delete_Error_With_Entries_And_Not_Found()
    {
        _read.Setup(r => r.HasEntries(1, 2)).ReturnsAsync(true);

        var withEntries = () => People().Delete(2);
        var missing = () => People().Delete(99);

        (await withEntries.ShouldThrowAsync<ConflictException>()).Message.ShouldBe(ResourceMessagesException.PERSON_HAS_ENTRIES);
        (await missing.ShouldThrowAsync<NotFoundException>()).Message.ShouldBe(ResourceMessagesException.PERSON_NOT_FOUND);
    }

    [Fact]
    public async Task Payment_Targets_Must_Be_Open_Charges_Of_The_Person()
    {
        Charge paid = new() { Key = "Manual:1", OriginType = ChargeOriginType.Manual, OriginId = 1, Description = "a",
            Month = new DateOnly(2026, 10, 1), Date = new DateOnly(2026, 10, 1), Amount = 50m };
        Charge open = paid with { Key = "Manual:2", OriginId = 2, Month = new DateOnly(2026, 11, 1), Date = new DateOnly(2026, 11, 1) };
        var ledger = new PersonLedger([paid, open], [new PaymentInput(9, new DateOnly(2026, 10, 5), 50m, [])], new HashSet<long>());
        _ledger.Setup(l => l.Load(1, 2, It.IsAny<DateOnly>())).ReturnsAsync(new Dictionary<long, PersonLedger> { [2] = ledger });

        var ok = await Entries().RegisterPayment(2, RequestPersonJsonBuilder.Payment(50m, CalendarBuilder.DefaultToday, "Manual:2"));
        var alreadyPaid = () => Entries().RegisterPayment(2, RequestPersonJsonBuilder.Payment(50m, CalendarBuilder.DefaultToday, "Manual:1"));
        var unknown = () => Entries().RegisterPayment(2, RequestPersonJsonBuilder.Payment(50m, CalendarBuilder.DefaultToday, "Manual:99"));
        var repeated = () => Entries().RegisterPayment(2, RequestPersonJsonBuilder.Payment(50m, CalendarBuilder.DefaultToday, "Manual:2", "Manual:2"));
        var future = () => Entries().RegisterPayment(2, RequestPersonJsonBuilder.Payment(50m, CalendarBuilder.DefaultToday.AddDays(1)));

        ok.ChargeKeys.ShouldBe(["Manual:2"]);
        foreach (var act in new[] { alreadyPaid, unknown, repeated })
            (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages().ShouldBe([ResourceMessagesException.PAYMENT_TARGETS_INVALID]);
        (await future.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages().ShouldBe([ResourceMessagesException.DATE_IN_FUTURE]);
    }

    [Fact]
    public async Task Charges_Require_Existing_Person()
    {
        var act = () => Entries().RegisterCharge(99, RequestPersonJsonBuilder.Charge());

        (await act.ShouldThrowAsync<NotFoundException>()).Message.ShouldBe(ResourceMessagesException.PERSON_NOT_FOUND);
    }

    private PersonUseCase People() => new(LoggedUserBuilder.Build(_user), _read.Object, new Mock<IPersonWriteOnlyRepository>().Object,
        _update.Object, _ledger.Object, UnitOfWorkBuilder.Build(), CalendarBuilder.Build(), new FakeTimeProvider());

    private PersonEntriesUseCase Entries() => new(LoggedUserBuilder.Build(_user), _read.Object, new Mock<IPersonChargeRepository>().Object,
        new Mock<IPersonPaymentRepository>().Object, _ledger.Object, UnitOfWorkBuilder.Build(), CalendarBuilder.Build(), new FakeTimeProvider());
}
