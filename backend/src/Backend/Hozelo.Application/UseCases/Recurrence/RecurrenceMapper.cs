using Hozelo.Application.Summaries;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Calculations;
using Hozelo.Domain.Entities;

namespace Hozelo.Application.UseCases.Recurrence;

public static class RecurrenceMapper
{
    public static ResponseRecurrenceJson ToResponse(RecurringEntry entry, DateOnly today)
    {
        var response = new ResponseRecurrenceJson
        {
            Amounts = entry.Amounts
                .OrderBy(a => a.EffectiveMonth)
                .Select(a => new ResponseRecurrenceAmountJson { FromMonth = YearMonth.Format(a.EffectiveMonth), Amount = a.Amount })
                .ToList(),
            Months = entry.Months
                .OrderBy(m => m.Month)
                .Select(m => new ResponseRecurrenceMonthJson
                {
                    Month = YearMonth.Format(m.Month),
                    Amount = m.Amount,
                    Skipped = m.Skipped,
                    SettledOn = m.SettledOn
                })
                .ToList()
        };

        Fill(response, entry, today);
        return response;
    }

    public static ResponseShortRecurrenceJson ToShortResponse(RecurringEntry entry, DateOnly today)
    {
        var response = new ResponseShortRecurrenceJson();
        Fill(response, entry, today);
        return response;
    }

    private static void Fill(ResponseShortRecurrenceJson response, RecurringEntry entry, DateOnly today)
    {
        var currentMonth = YearMonth.FirstDay(today);

        // Valor "atual" pela regra: mês atual, limitado ao período da recorrência.
        var reference = currentMonth < entry.StartMonth ? entry.StartMonth : currentMonth;
        if (entry.EndMonth.HasValue && reference > entry.EndMonth.Value)
            reference = entry.EndMonth.Value;

        response.Id = entry.Id;
        response.Kind = (EntryKind)(int)entry.Kind;
        response.Name = entry.Name;
        response.Category = ExpenseMapper.ToCategorySummary(entry.Category);
        response.DayOfMonth = entry.DayOfMonth;
        response.StartMonth = YearMonth.Format(entry.StartMonth);
        response.EndMonth = YearMonth.Format(entry.EndMonth);
        response.IsActive = entry.EndMonth is null || entry.EndMonth.Value >= currentMonth;
        response.CurrentAmount = entry.RuleAmount(reference);
        response.Notes = entry.Notes;
    }
}
