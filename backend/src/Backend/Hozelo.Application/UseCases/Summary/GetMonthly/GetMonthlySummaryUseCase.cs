using Hozelo.Communication.Responses;
using Hozelo.Domain.Calculations;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories.Income;
using Hozelo.Domain.Repositories.Installment;
using Hozelo.Domain.Repositories.OpeningBalance;
using Hozelo.Domain.Repositories.Person;
using Hozelo.Application.UseCases.Person;
using Hozelo.Domain.Repositories.Recurrence;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Summary.GetMonthly;

/// <summary>
/// Resumo do mês: monta os lançamentos das três fontes (parcelas, receitas avulsas e recorrências) e calcula
/// previsto, realizado, pendências e acumulado com o <see cref="BalanceCalculator"/> (research.md §7 e §8).
/// </summary>
public sealed class GetMonthlySummaryUseCase(
    ILoggedUser loggedUser,
    IInstallmentReadOnlyRepository installmentRepository,
    IIncomeReadOnlyRepository incomeRepository,
    IRecurrenceReadOnlyRepository recurrenceRepository,
    IOpeningBalanceRepository openingBalanceRepository,
    IPersonReadOnlyRepository personRepository,
    IPersonLedgerLoader personLedgerLoader,
    ICalendar calendar) : IGetMonthlySummaryUseCase
{
    public async Task<ResponseMonthlySummaryJson> Execute(int? year, int? month, long? categoryId)
    {
        var today = calendar.Today();
        var target = ResolveMonth(year, month, today);
        var currentMonth = YearMonth.FirstDay(today);

        var user = await loggedUser.User();

        var openingEntity = categoryId is null ? await openingBalanceRepository.Get(user.Id) : null;
        var opening = openingEntity is null ? null : new OpeningPoint(openingEntity.Amount, openingEntity.ReferenceDate);

        // Intervalo carregado: do saldo inicial (para o acumulado) até o mês consultado ou o atual (pendências).
        var start = opening is not null && opening.Month < target ? opening.Month : target;
        var end = (target > currentMonth ? target : currentMonth).AddMonths(1);

        var entries = await LoadEntries(user.Id, start, end, categoryId);

        // Reembolsos de terceiros (feature 004): só sem filtro de categoria.
        var reimbursementPending = new List<ResponseLedgerItemJson>();
        var extraPending = 0.00m;
        if (categoryId is null)
            (extraPending, reimbursementPending) = await AddReimbursements(user.Id, entries, start, end, currentMonth);

        var monthEntries = entries.Where(e => e.Month == target).OrderBy(e => e.Date).ThenBy(e => e.Name).ToList();
        var totals = BalanceCalculator.Totals(monthEntries);

        var incomeItems = monthEntries.Where(e => e.Direction == EntryKind.Income && e.Source != LedgerSource.Reimbursement).Select(ToItem)
            .Concat(ReimbursementItems(monthEntries, target))
            .OrderBy(i => i.Date).ThenBy(i => i.Name)
            .ToList();

        var response = new ResponseMonthlySummaryJson
        {
            Year = target.Year,
            Month = target.Month,
            Incomes = incomeItems,
            Expenses = monthEntries.Where(e => e.Direction == EntryKind.Expense).Select(ToItem).ToList(),
            Forecast = new ResponseForecastJson
            {
                Incomes = totals.ForecastIncomes,
                Expenses = totals.ForecastExpenses,
                Balance = totals.ForecastBalance
            },
            Realized = new ResponseRealizedJson
            {
                Received = totals.Received,
                Paid = totals.Paid,
                Balance = totals.RealizedBalance
            },
            OpeningBalanceMissing = categoryId is null && opening is null
        };

        if (opening is null)
            return response;

        if (target == currentMonth)
        {
            var pending = BalanceCalculator.Pending(entries, opening, currentMonth);
            response.Pending = new ResponsePendingJson
            {
                ToReceive = pending.Where(e => e.Direction == EntryKind.Income).Aggregate(0.00m, (t, e) => t + e.Amount) + extraPending,
                ToPay = pending.Where(e => e.Direction == EntryKind.Expense).Aggregate(0.00m, (t, e) => t + e.Amount),
                Items = pending.Select(ToItem).Concat(reimbursementPending).ToList()
            };
        }

        var accumulated = BalanceCalculator.Accumulated(entries, opening, currentMonth, target, extraPending);
        if (accumulated is not null)
            response.Accumulated = new ResponseAccumulatedJson
            {
                PreviousBalance = accumulated.PreviousBalance,
                EndBalance = accumulated.EndBalance
            };

        return response;
    }

    private async Task<List<LedgerEntry>> LoadEntries(long userId, DateOnly start, DateOnly end, long? categoryId)
    {
        var entries = new List<LedgerEntry>();

        foreach (var installment in await installmentRepository.GetByRange(userId, start, end, categoryId))
        {
            // Regra da 002: antecipada pertence ao mês do pagamento; senão ao mês do vencimento.
            var paidInAdvance = installment.PaidOn.HasValue && installment.PaidOn.Value < YearMonth.FirstDay(installment.DueDate);
            var date = paidInAdvance ? installment.PaidOn!.Value : installment.DueDate;

            entries.Add(new LedgerEntry
            {
                Direction = EntryKind.Expense,
                Source = LedgerSource.Installment,
                SourceId = installment.ExpenseId,
                Name = installment.Expense.Name,
                CategoryId = installment.Expense.CategoryId,
                CategoryName = installment.Expense.Category.Name,
                Month = YearMonth.FirstDay(date),
                Date = date,
                Amount = installment.PaidAmount ?? installment.Amount,
                SettledOn = installment.PaidOn,
                SettledAmount = installment.PaidAmount ?? 0m,
                Number = installment.Number,
                InstallmentsCount = installment.Expense.InstallmentsCount,
                PaidInAdvance = paidInAdvance
            });
        }

        foreach (var income in await incomeRepository.GetAll(userId, categoryId, start, end))
        {
            entries.Add(new LedgerEntry
            {
                Direction = EntryKind.Income,
                Source = LedgerSource.Income,
                SourceId = income.Id,
                Name = income.Name,
                CategoryId = income.CategoryId,
                CategoryName = income.Category.Name,
                Month = YearMonth.FirstDay(income.ExpectedDate),
                Date = income.ExpectedDate,
                Amount = income.Amount,
                SettledOn = income.ReceivedOn,
                SettledAmount = income.ReceivedOn.HasValue ? income.Amount : 0m
            });
        }

        foreach (var recurrence in await recurrenceRepository.GetAll(userId, null, categoryId))
        {
            foreach (var occurrence in RecurrenceCalculator.Between(recurrence, start, end))
            {
                entries.Add(new LedgerEntry
                {
                    Direction = recurrence.Kind,
                    Source = LedgerSource.Recurrence,
                    SourceId = recurrence.Id,
                    Name = recurrence.Name,
                    CategoryId = recurrence.CategoryId,
                    CategoryName = recurrence.Category.Name,
                    Month = occurrence.Month,
                    Date = occurrence.Date,
                    Amount = occurrence.Amount,
                    SettledOn = occurrence.SettledOn,
                    SettledAmount = occurrence.IsSettled ? occurrence.Amount : 0m
                });
            }
        }

        return entries;
    }

    /// <summary>
    /// Uma entrada por cobrança (previsto) e uma por pagamento (realizado) de cada pessoa; pendência do mês atual = saldo
    /// líquido de cada pessoa ao fim do mês anterior (research.md 004 §9).
    /// </summary>
    private async Task<(decimal ExtraPending, List<ResponseLedgerItemJson> PendingItems)> AddReimbursements(
        long userId, List<LedgerEntry> entries, DateOnly start, DateOnly end, DateOnly currentMonth)
    {
        var people = (await personRepository.GetAll(userId)).ToDictionary(p => p.Id);
        var ledgers = await personLedgerLoader.Load(userId, null, end);
        var pendingItems = new List<ResponseLedgerItemJson>();
        var extraPending = 0.00m;
        var previousMonth = currentMonth.AddMonths(-1);

        foreach (var (personId, ledger) in ledgers)
        {
            if (!people.TryGetValue(personId, out var person))
                continue;

            var name = $"Reembolso — {person.Name}";

            foreach (var charge in ledger.Charges.Where(c => c.Month >= start && c.Month < end))
                entries.Add(Reimbursement(personId, name, charge.Month, charge.Date, charge.Amount, 0m, null));

            foreach (var payment in ledger.Payments.Where(p => p.PaidOn >= start && p.PaidOn < end))
                entries.Add(Reimbursement(personId, name, YearMonth.FirstDay(payment.PaidOn), payment.PaidOn, 0m, payment.Amount, payment.PaidOn));

            // Dívida antiga paga no mês atual sai da pendência e entra no previsto do mês (acumulado não muda, SC-007).
            var current = PersonStatementCalculator.Month(ledger.Charges.ToList(), ledger.Payments.ToList(), currentMonth);
            var appliedToOldDebt = current.PreviousBalance > 0 ? Math.Min(current.TotalPaid, current.PreviousBalance) : 0m;
            if (appliedToOldDebt > 0 && currentMonth >= start && currentMonth < end)
                entries.Add(Reimbursement(personId, name, currentMonth, currentMonth, appliedToOldDebt, 0m, null));

            var balance = current.PreviousBalance - appliedToOldDebt;
            if (balance == 0)
                continue;

            extraPending += balance;
            pendingItems.Add(new ResponseLedgerItemJson
            {
                Source = Communication.Enums.LedgerSource.Reimbursement,
                SourceId = personId,
                Direction = Communication.Enums.EntryKind.Income,
                Name = name,
                Category = null,
                Month = YearMonth.Format(previousMonth),
                Date = previousMonth,
                Amount = balance
            });
        }

        return (extraPending, pendingItems);
    }

    private static LedgerEntry Reimbursement(long personId, string name, DateOnly month, DateOnly date, decimal amount, decimal settled, DateOnly? settledOn) => new()
    {
        Direction = EntryKind.Income,
        Source = LedgerSource.Reimbursement,
        SourceId = personId,
        Name = name,
        CategoryId = 0,
        CategoryName = string.Empty,
        Month = month,
        Date = date,
        Amount = amount,
        SettledOn = settledOn,
        SettledAmount = settled,
        PendingExempt = true
    };

    /// <summary>Um item por pessoa no mês: previsto = cobranças, realizado = pagamentos.</summary>
    private static IEnumerable<ResponseLedgerItemJson> ReimbursementItems(IEnumerable<LedgerEntry> monthEntries, DateOnly month) =>
        monthEntries
            .Where(e => e.Source == LedgerSource.Reimbursement)
            .GroupBy(e => e.SourceId)
            .Select(g =>
            {
                var paid = g.Aggregate(0.00m, (t, e) => t + e.SettledAmount);
                return new ResponseLedgerItemJson
                {
                    Source = Communication.Enums.LedgerSource.Reimbursement,
                    SourceId = g.Key,
                    Direction = Communication.Enums.EntryKind.Income,
                    Name = g.First().Name,
                    Category = null,
                    Month = YearMonth.Format(month),
                    Date = month,
                    Amount = g.Aggregate(0.00m, (t, e) => t + e.Amount),
                    IsSettled = paid > 0,
                    SettledAmount = paid
                };
            });

    private static ResponseLedgerItemJson ToItem(LedgerEntry entry) => new()
    {
        Source = (Communication.Enums.LedgerSource)(int)entry.Source,
        SourceId = entry.SourceId,
        Direction = (Communication.Enums.EntryKind)(int)entry.Direction,
        Number = entry.Number,
        InstallmentsCount = entry.InstallmentsCount,
        Name = entry.Name,
        Category = new ResponseCategorySummaryJson { Id = entry.CategoryId, Name = entry.CategoryName },
        Month = YearMonth.Format(entry.Month),
        Date = entry.Date,
        Amount = entry.Amount,
        IsSettled = entry.IsSettled,
        SettledAmount = entry.IsSettled ? entry.SettledAmount : null,
        SettledOn = entry.SettledOn,
        PaidInAdvance = entry.PaidInAdvance
    };

    private static DateOnly ResolveMonth(int? year, int? month, DateOnly today)
    {
        if (year.HasValue != month.HasValue)
            throw new ErrorOnValidationException([ResourceMessagesException.MONTH_INVALID]);

        var targetYear = year ?? today.Year;
        var targetMonth = month ?? today.Month;

        if (targetMonth is < 1 or > 12 || targetYear is < 2000 or > 2100)
            throw new ErrorOnValidationException([ResourceMessagesException.MONTH_INVALID]);

        return new DateOnly(targetYear, targetMonth, 1);
    }
}
