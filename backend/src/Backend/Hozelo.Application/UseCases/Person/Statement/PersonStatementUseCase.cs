using Hozelo.Communication.Responses;
using Hozelo.Domain.Calculations;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories.Person;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Person.Statement;

/// <summary>Extrato do mês e resumo por origem de uma pessoa (research.md 004 §6–§8).</summary>
public sealed class PersonStatementUseCase(
    ILoggedUser loggedUser,
    IPersonReadOnlyRepository personRepository,
    IPersonPaymentRepository paymentRepository,
    IPersonLedgerLoader ledgerLoader,
    ICalendar calendar) : IPersonStatementUseCase
{
    public async Task<ResponsePersonStatementJson> Statement(long personId, int? year, int? month)
    {
        var today = calendar.Today();
        var target = ResolveMonth(year, month, today);
        var currentMonth = YearMonth.FirstDay(today);

        var (userId, person) = await Person(personId);

        var limit = (target > currentMonth ? target : currentMonth).AddMonths(1);
        var ledger = (await ledgerLoader.Load(userId, personId, limit)).GetValueOrDefault(personId) ?? PersonLedger.Empty;
        var allocation = PaymentAllocator.Allocate(ledger.Charges, ledger.Payments);
        var statement = PersonStatementCalculator.Month(ledger.Charges.ToList(), ledger.Payments.ToList(), target);

        var payments = (await paymentRepository.GetAll(userId, personId)).ToDictionary(p => p.Id);

        return new ResponsePersonStatementJson
        {
            Person = new ResponsePersonSummaryJson { Id = person.Id, Name = person.Name },
            Year = target.Year,
            Month = target.Month,
            PreviousBalance = statement.PreviousBalance,
            Charges = statement.Charges.Select(c => ToItem(c, allocation)).ToList(),
            TotalCharges = statement.TotalCharges,
            TotalDue = statement.TotalDue,
            Payments = statement.Payments.Select(p => Entries.PersonEntriesUseCase.ToResponse(payments[p.Id])).ToList(),
            TotalPaid = statement.TotalPaid,
            EndBalance = statement.EndBalance
        };
    }

    public async Task<ResponsePersonOverviewJson> Summary(long personId)
    {
        var today = calendar.Today();
        var currentMonth = YearMonth.FirstDay(today);

        var (userId, person) = await Person(personId);

        var ledger = (await ledgerLoader.Load(userId, personId, currentMonth.AddMonths(1))).GetValueOrDefault(personId) ?? PersonLedger.Empty;
        var allocation = PaymentAllocator.Allocate(ledger.Charges, ledger.Payments);

        var origins = ledger.Charges
            .GroupBy(c => (c.OriginType, c.OriginId))
            .Select(g =>
            {
                var charges = g.OrderBy(c => c.Date).ToList();
                var isOpenEnded = g.Key.OriginType == ChargeOriginType.Recurrence && ledger.OpenEndedRecurrenceIds.Contains(g.Key.OriginId);
                var total = charges.Aggregate(0.00m, (t, c) => t + c.Amount);
                var paid = charges.Aggregate(0.00m, (t, c) => t + allocation.Charges[c.Key].Paid);

                return new ResponsePersonOriginJson
                {
                    OriginType = (Communication.Enums.ChargeOriginType)(int)g.Key.OriginType,
                    OriginId = g.Key.OriginId,
                    Description = charges[0].Description,
                    ChargesDue = charges.Count(c => c.Month <= currentMonth),
                    ChargesTotal = charges.Count,
                    MonthlyAmount = g.Key.OriginType == ChargeOriginType.Recurrence
                        ? (charges.LastOrDefault(c => c.Month <= currentMonth) ?? charges[0]).Amount
                        : null,
                    Total = total,
                    Paid = paid,
                    Remaining = total - paid,
                    IsOpenEnded = isOpenEnded
                };
            })
            .OrderBy(o => o.Description)
            .ToList();

        return new ResponsePersonOverviewJson
        {
            Person = new ResponsePersonSummaryJson { Id = person.Id, Name = person.Name },
            Origins = origins,
            OwedUntilNow = PersonStatementCalculator.OwedUntilNow(ledger.Charges, ledger.Payments, today),
            OwedTotal = PersonStatementCalculator.OwedTotal(ledger.Charges, ledger.Payments),
            UnallocatedCredit = allocation.UnallocatedCredit
        };
    }

    private async Task<(long UserId, Domain.Entities.Person Person)> Person(long personId)
    {
        var user = await loggedUser.User();

        var person = await personRepository.GetById(user.Id, personId)
            ?? throw new NotFoundException(ResourceMessagesException.PERSON_NOT_FOUND);

        return (user.Id, person);
    }

    private static ResponsePersonChargeItemJson ToItem(Charge charge, AllocationResult allocation)
    {
        var allocated = allocation.Charges[charge.Key];

        return new ResponsePersonChargeItemJson
        {
            Key = charge.Key,
            OriginType = (Communication.Enums.ChargeOriginType)(int)charge.OriginType,
            OriginId = charge.OriginId,
            Description = charge.Description,
            Number = charge.Number,
            Count = charge.Count,
            Date = charge.Date,
            Amount = charge.Amount,
            Paid = allocated.Paid,
            Remaining = allocated.Remaining,
            Status = (Communication.Enums.ChargeStatus)(int)allocated.Status
        };
    }

    private static DateOnly ResolveMonth(int? year, int? month, DateOnly today)
    {
        if (year.HasValue != month.HasValue || month is < 1 or > 12 || year is < 2000 or > 2100)
            throw new ErrorOnValidationException([ResourceMessagesException.MONTH_INVALID]);

        return new DateOnly(year ?? today.Year, month ?? today.Month, 1);
    }
}
