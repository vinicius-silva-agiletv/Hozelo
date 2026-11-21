using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.Income;
using Microsoft.EntityFrameworkCore;

namespace Hozelo.Infrastructure.DataAccess.Repositories;

public sealed class IncomeRepository(HozeloDbContext dbContext)
    : IIncomeReadOnlyRepository, IIncomeWriteOnlyRepository, IIncomeUpdateOnlyRepository
{
    public async Task Add(Income income) => await dbContext.Set<Income>().AddAsync(income);

    public void Delete(Income income) => dbContext.Set<Income>().Remove(income);

    Task<Income?> IIncomeReadOnlyRepository.GetById(long userId, long incomeId) =>
        dbContext.Set<Income>().AsNoTracking().Include(i => i.Category)
            .FirstOrDefaultAsync(i => i.UserId == userId && i.Id == incomeId);

    public async Task<IList<Income>> GetAll(long userId, long? categoryId, DateOnly? from, DateOnly? to)
    {
        var query = dbContext.Set<Income>().AsNoTracking().Include(i => i.Category).Where(i => i.UserId == userId);

        if (categoryId.HasValue)
            query = query.Where(i => i.CategoryId == categoryId.Value);
        if (from.HasValue)
            query = query.Where(i => i.ExpectedDate >= from.Value);
        if (to.HasValue)
            query = query.Where(i => i.ExpectedDate < to.Value);

        return await query.OrderByDescending(i => i.ExpectedDate).ThenBy(i => i.Name).ToListAsync();
    }

    Task<Income?> IIncomeUpdateOnlyRepository.GetById(long userId, long incomeId) =>
        dbContext.Set<Income>().FirstOrDefaultAsync(i => i.UserId == userId && i.Id == incomeId);
}
