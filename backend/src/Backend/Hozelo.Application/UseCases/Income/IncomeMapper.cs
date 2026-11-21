using Hozelo.Application.Summaries;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Income;

public static class IncomeMapper
{
    public static ResponseIncomeJson ToResponse(Domain.Entities.Income income) => new()
    {
        Id = income.Id,
        Name = income.Name,
        Category = ExpenseMapper.ToCategorySummary(income.Category),
        Amount = income.Amount,
        ExpectedDate = income.ExpectedDate,
        IsReceived = income.IsReceived,
        ReceivedOn = income.ReceivedOn,
        Notes = income.Notes
    };
}
