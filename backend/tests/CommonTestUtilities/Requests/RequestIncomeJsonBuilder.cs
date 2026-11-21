using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;

namespace CommonTestUtilities.Requests;

public static class RequestIncomeJsonBuilder
{
    public static RequestIncomeJson Build(long categoryId = 1, decimal amount = 2500.00m, DateOnly? expectedDate = null) => new()
    {
        Name = "13º - primeira parcela",
        CategoryId = categoryId,
        Amount = amount,
        ExpectedDate = expectedDate ?? new DateOnly(2026, 11, 30),
        Notes = "Empresa X"
    };
}

public static class RequestRecurrenceJsonBuilder
{
    public static RequestRecurrenceJson Salary(long categoryId = 1, decimal amount = 6000.00m, string startMonth = "2026-01", int day = 5) => new()
    {
        Kind = EntryKind.Income,
        Name = "Salário",
        CategoryId = categoryId,
        Amount = amount,
        DayOfMonth = day,
        StartMonth = startMonth
    };

    public static RequestRecurrenceJson Bill(long categoryId = 1, decimal amount = 120.00m, string startMonth = "2026-11", int day = 15) => new()
    {
        Kind = EntryKind.Expense,
        Name = "Internet",
        CategoryId = categoryId,
        Amount = amount,
        DayOfMonth = day,
        StartMonth = startMonth
    };
}
