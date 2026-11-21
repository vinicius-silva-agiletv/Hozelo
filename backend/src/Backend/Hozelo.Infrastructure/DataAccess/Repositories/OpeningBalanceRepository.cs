using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.OpeningBalance;
using Microsoft.EntityFrameworkCore;

namespace Hozelo.Infrastructure.DataAccess.Repositories;

public sealed class OpeningBalanceRepository(HozeloDbContext dbContext) : IOpeningBalanceRepository
{
    public Task<OpeningBalance?> Get(long userId) =>
        dbContext.Set<OpeningBalance>().AsNoTracking().FirstOrDefaultAsync(o => o.UserId == userId);

    public Task<OpeningBalance?> GetForUpdate(long userId) =>
        dbContext.Set<OpeningBalance>().FirstOrDefaultAsync(o => o.UserId == userId);

    public async Task Add(OpeningBalance openingBalance) => await dbContext.Set<OpeningBalance>().AddAsync(openingBalance);
}
