using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.Installment;
using Microsoft.EntityFrameworkCore;

namespace Hozelo.Infrastructure.DataAccess.Repositories;

public sealed class InstallmentRepository(HozeloDbContext dbContext) : IInstallmentReadOnlyRepository
{
    public Task<IList<ExpenseInstallment>> GetByMonth(
        long userId, DateOnly monthStart, DateOnly nextMonthStart, long? categoryId) =>
        GetByRange(userId, monthStart, nextMonthStart, categoryId);

    public async Task<IList<ExpenseInstallment>> GetByRange(
        long userId, DateOnly monthStart, DateOnly nextMonthStart, long? categoryId)
    {
        var query = dbContext.Set<ExpenseInstallment>()
            .AsNoTracking()
            .Include(i => i.Expense).ThenInclude(e => e.Category)
            .Where(i => i.Expense.UserId == userId)
            .Where(i =>
                // vence no mês e não foi paga antes dele (em dia, atrasada ou em aberto)
                (i.DueDate >= monthStart && i.DueDate < nextMonthStart
                    && !(i.PaidOn != null && i.PaidOn < monthStart))
                // ou foi paga neste mês, antes do mês de vencimento (antecipada)
                || (i.PaidOn >= monthStart && i.PaidOn < nextMonthStart && i.DueDate >= nextMonthStart));

        if (categoryId.HasValue)
            query = query.Where(i => i.Expense.CategoryId == categoryId.Value);

        return await query.ToListAsync();
    }
}
