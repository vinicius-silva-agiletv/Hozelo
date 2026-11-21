using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.Expense;
using Microsoft.EntityFrameworkCore;

namespace Hozelo.Infrastructure.DataAccess.Repositories;

public sealed class ExpenseRepository(HozeloDbContext dbContext)
    : IExpenseReadOnlyRepository, IExpenseWriteOnlyRepository, IExpenseUpdateOnlyRepository
{
    public async Task Add(Expense expense) => await dbContext.Set<Expense>().AddAsync(expense);

    public void Delete(Expense expense) => dbContext.Set<Expense>().Remove(expense);

    Task<Expense?> IExpenseReadOnlyRepository.GetById(long userId, long expenseId) =>
        dbContext.Set<Expense>()
            .AsNoTracking()
            .Include(e => e.Category)
            .Include(e => e.Person)
            .Include(e => e.Installments)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.Id == expenseId);

    public async Task<IList<Expense>> GetAll(long userId, long? categoryId)
    {
        var query = dbContext.Set<Expense>()
            .AsNoTracking()
            .AsSplitQuery()
            .Include(e => e.Category)
            .Include(e => e.Person)
            .Include(e => e.Installments)
            .Where(e => e.UserId == userId);

        if (categoryId.HasValue)
            query = query.Where(e => e.CategoryId == categoryId.Value);

        return await query.ToListAsync();
    }

    public async Task<IList<Expense>> GetMarked(long userId, long? personId) =>
        await dbContext.Set<Expense>()
            .AsNoTracking()
            .AsSplitQuery()
            .Include(e => e.Installments)
            .Where(e => e.UserId == userId && e.PersonId != null && (personId == null || e.PersonId == personId))
            .ToListAsync();

    Task<Expense?> IExpenseUpdateOnlyRepository.GetById(long userId, long expenseId) =>
        dbContext.Set<Expense>()
            .Include(e => e.Installments)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.Id == expenseId);
}
