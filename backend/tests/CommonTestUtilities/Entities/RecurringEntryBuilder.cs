using Hozelo.Domain.Entities;
using Hozelo.Domain.Enums;

namespace CommonTestUtilities.Entities;

public static class RecurringEntryBuilder
{
    public static RecurringEntry Build(
        decimal amount = 6000m,
        int day = 5,
        DateOnly? startMonth = null,
        DateOnly? endMonth = null,
        EntryKind kind = EntryKind.Income,
        long id = 1,
        Category? category = null)
    {
        category ??= CategoryBuilder.Build(9, kind == EntryKind.Income ? "Salário" : "Internet",
            type: kind == EntryKind.Income ? CategoryType.Income : CategoryType.Expense);
        var start = startMonth ?? new DateOnly(2026, 1, 1);

        return new RecurringEntry
        {
            Id = id,
            UserId = 1,
            CategoryId = category.Id,
            Category = category,
            Kind = kind,
            Name = kind == EntryKind.Income ? "Salário" : "Internet",
            DayOfMonth = day,
            StartMonth = start,
            EndMonth = endMonth,
            Amounts = [new RecurringEntryAmount { EffectiveMonth = start, Amount = amount }]
        };
    }
}

public static class IncomeBuilder
{
    public static Income Build(long id = 1, decimal amount = 2500m, DateOnly? expectedDate = null, DateOnly? receivedOn = null, Category? category = null)
    {
        category ??= CategoryBuilder.Build(8, "13º salário", type: CategoryType.Income);

        return new Income
        {
            Id = id,
            UserId = 1,
            CategoryId = category.Id,
            Category = category,
            Name = "13º",
            Amount = amount,
            ExpectedDate = expectedDate ?? new DateOnly(2026, 11, 30),
            ReceivedOn = receivedOn
        };
    }
}
