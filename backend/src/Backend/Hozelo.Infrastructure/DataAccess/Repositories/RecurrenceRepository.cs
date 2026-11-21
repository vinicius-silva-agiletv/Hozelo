using Hozelo.Domain.Entities;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories.Recurrence;
using Microsoft.EntityFrameworkCore;

namespace Hozelo.Infrastructure.DataAccess.Repositories;

public sealed class RecurrenceRepository(HozeloDbContext dbContext)
    : IRecurrenceReadOnlyRepository, IRecurrenceWriteOnlyRepository, IRecurrenceUpdateOnlyRepository
{
    public async Task Add(RecurringEntry entry) => await dbContext.Set<RecurringEntry>().AddAsync(entry);

    public void Delete(RecurringEntry entry) => dbContext.Set<RecurringEntry>().Remove(entry);

    Task<RecurringEntry?> IRecurrenceReadOnlyRepository.GetById(long userId, long recurrenceId) =>
        WithDetails(dbContext.Set<RecurringEntry>().AsNoTracking())
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Id == recurrenceId);

    public async Task<IList<RecurringEntry>> GetAll(long userId, EntryKind? kind, long? categoryId)
    {
        var query = WithDetails(dbContext.Set<RecurringEntry>().AsNoTracking()).Where(r => r.UserId == userId);

        if (kind.HasValue)
            query = query.Where(r => r.Kind == kind.Value);
        if (categoryId.HasValue)
            query = query.Where(r => r.CategoryId == categoryId.Value);

        return await query.OrderBy(r => r.Name).ToListAsync();
    }

    Task<RecurringEntry?> IRecurrenceUpdateOnlyRepository.GetById(long userId, long recurrenceId) =>
        dbContext.Set<RecurringEntry>()
            .Include(r => r.Amounts)
            .Include(r => r.Months)
            .AsSplitQuery()
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Id == recurrenceId);

    private static IQueryable<RecurringEntry> WithDetails(IQueryable<RecurringEntry> query) =>
        query.Include(r => r.Category).Include(r => r.Amounts).Include(r => r.Months).AsSplitQuery();
}
