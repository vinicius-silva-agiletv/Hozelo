using Hozelo.Domain.Entities;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories.Category;
using Microsoft.EntityFrameworkCore;

namespace Hozelo.Infrastructure.DataAccess.Repositories;

public sealed class CategoryRepository(HozeloDbContext dbContext)
    : ICategoryReadOnlyRepository, ICategoryWriteOnlyRepository, ICategoryUpdateOnlyRepository
{
    public async Task<IList<CategoryWithEntriesCount>> GetAll(long userId, CategoryType? type = null)
    {
        var query = dbContext.Set<Category>().AsNoTracking().Where(c => c.UserId == userId);

        if (type.HasValue)
            query = query.Where(c => c.Type == type.Value);

        var rows = await query
            .OrderBy(c => c.Name.ToLower())
            .Select(c => new
            {
                Category = c,
                Count = dbContext.Set<Expense>().Count(e => e.CategoryId == c.Id)
                    + dbContext.Set<Income>().Count(i => i.CategoryId == c.Id)
                    + dbContext.Set<RecurringEntry>().Count(r => r.CategoryId == c.Id)
            })
            .ToListAsync();

        return rows.Select(r => new CategoryWithEntriesCount(r.Category, r.Count)).ToList();
    }

    Task<Category?> ICategoryReadOnlyRepository.GetById(long userId, long categoryId) =>
        dbContext.Set<Category>().AsNoTracking().FirstOrDefaultAsync(c => c.UserId == userId && c.Id == categoryId);

    public Task<bool> ExistsWithName(long userId, CategoryType type, string name, long? excludingId = null)
    {
        var lowered = name.ToLower();

        return dbContext.Set<Category>().AnyAsync(c =>
            c.UserId == userId && c.Type == type && c.Name.ToLower() == lowered
            && (excludingId == null || c.Id != excludingId));
    }

    public async Task<bool> HasEntries(long userId, long categoryId) =>
        await dbContext.Set<Expense>().AnyAsync(e => e.UserId == userId && e.CategoryId == categoryId)
        || await dbContext.Set<Income>().AnyAsync(i => i.UserId == userId && i.CategoryId == categoryId)
        || await dbContext.Set<RecurringEntry>().AnyAsync(r => r.UserId == userId && r.CategoryId == categoryId);

    public async Task Add(Category category) => await dbContext.Set<Category>().AddAsync(category);

    public void Delete(Category category) => dbContext.Set<Category>().Remove(category);

    Task<Category?> ICategoryUpdateOnlyRepository.GetById(long userId, long categoryId) =>
        dbContext.Set<Category>().FirstOrDefaultAsync(c => c.UserId == userId && c.Id == categoryId);
}
