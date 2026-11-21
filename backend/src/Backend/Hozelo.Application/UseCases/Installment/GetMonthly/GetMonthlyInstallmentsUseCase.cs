using Hozelo.Application.Summaries;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.Installment;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Installment.GetMonthly;

public sealed class GetMonthlyInstallmentsUseCase(
    ILoggedUser loggedUser,
    IInstallmentReadOnlyRepository readOnlyRepository,
    ICalendar calendar) : IGetMonthlyInstallmentsUseCase
{
    private const int MinYear = 2000;
    private const int MaxYear = 2100;

    public async Task<ResponseMonthlyInstallmentsJson> Execute(int? year, int? month, long? categoryId)
    {
        var (targetYear, targetMonth) = ResolveMonth(year, month);

        var user = await loggedUser.User();

        var monthStart = new DateOnly(targetYear, targetMonth, 1);
        var installments = await readOnlyRepository.GetByMonth(user.Id, monthStart, monthStart.AddMonths(1), categoryId);

        var items = installments
            .Select(i => (Installment: i, PaidInAdvance: IsPaidInAdvance(i)))
            .OrderBy(x => x.PaidInAdvance ? x.Installment.PaidOn!.Value : x.Installment.DueDate)
            .ThenBy(x => x.Installment.Expense.Name)
            .ThenBy(x => x.Installment.Number)
            .ToList();

        var paidAmount = items.Where(x => x.Installment.IsPaid).Sum(x => x.Installment.PaidAmount!.Value);
        var openAmount = items.Where(x => !x.Installment.IsPaid).Sum(x => x.Installment.Amount);

        return new ResponseMonthlyInstallmentsJson
        {
            Year = targetYear,
            Month = targetMonth,
            TotalAmount = paidAmount + openAmount,
            PaidAmount = paidAmount,
            OpenAmount = openAmount,
            Installments = items.Select(x => new ResponseMonthlyInstallmentJson
            {
                ExpenseId = x.Installment.ExpenseId,
                ExpenseName = x.Installment.Expense.Name,
                Category = ExpenseMapper.ToCategorySummary(x.Installment.Expense.Category),
                Number = x.Installment.Number,
                InstallmentsCount = x.Installment.Expense.InstallmentsCount,
                DueDate = x.Installment.DueDate,
                Amount = x.Installment.Amount,
                IsPaid = x.Installment.IsPaid,
                PaidOn = x.Installment.PaidOn,
                PaidAmount = x.Installment.PaidAmount,
                Prepaid = x.Installment.Prepaid,
                PaidInAdvance = x.PaidInAdvance
            }).ToList()
        };
    }

    private (int Year, int Month) ResolveMonth(int? year, int? month)
    {
        if (year.HasValue != month.HasValue)
            throw new ErrorOnValidationException([ResourceMessagesException.MONTH_INVALID]);

        var today = calendar.Today();
        var targetYear = year ?? today.Year;
        var targetMonth = month ?? today.Month;

        if (targetMonth is < 1 or > 12 || targetYear is < MinYear or > MaxYear)
            throw new ErrorOnValidationException([ResourceMessagesException.MONTH_INVALID]);

        return (targetYear, targetMonth);
    }

    /// <summary>Paga em mês anterior ao do vencimento (research.md §12).</summary>
    private static bool IsPaidInAdvance(ExpenseInstallment installment) =>
        installment.PaidOn.HasValue
        && installment.PaidOn.Value < new DateOnly(installment.DueDate.Year, installment.DueDate.Month, 1);
}
