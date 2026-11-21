using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.Category;
using Microsoft.EntityFrameworkCore;

namespace Hozelo.Infrastructure.DataAccess.Repositories;

public sealed class CategoryRepository(HozeloDbContext dbContext)
    : ICategoryReadOnlyRepository, ICategoryWriteOnlyRepository, ICategoryUpdateOnlyRepository
{
    public async Task<IList<CategoryWithExpensesCount>> GetAll(long userId)
    {
        var rows = await dbContext.Set<Category>()
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Name.ToLower())
            .Select(c => new
            {
                Category = c,
                Count = dbContext.Set<Expense>().Count(e => e.CategoryId == c.Id)
            })
            .ToListAsync();

        return rows.Select(r => new CategoryWithExpensesCount(r.Category, r.Count)).ToList();
    }

    Task<Category?> ICategoryReadOnlyRepository.GetById(long userId, long categoryId) =>
        dbContext.Set<Category>().AsNoTracking().FirstOrDefaultAsync(c => c.UserId == userId && c.Id == categoryId);

    public Task<bool> ExistsWithName(long userId, string name, long? excludingId = null)
    {
        var lowered = name.ToLower();

        return dbContext.Set<Category>().AnyAsync(c =>
            c.UserId == userId && c.Name.ToLower() == lowered && (excludingId == null || c.Id != excludingId));
    }

    public Task<bool> HasExpenses(long userId, long categoryId) =>
        dbContext.Set<Expense>().AnyAsync(e => e.UserId == userId && e.CategoryId == categoryId);

    public async Task Add(Category category) => await dbContext.Set<Category>().AddAsync(category);

    public void Delete(Category category) => dbContext.Set<Category>().Remove(category);

    Task<Category?> ICategoryUpdateOnlyRepository.GetById(long userId, long categoryId) =>
        dbContext.Set<Category>().FirstOrDefaultAsync(c => c.UserId == userId && c.Id == categoryId);
}
