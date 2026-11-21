using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.User;
using Microsoft.EntityFrameworkCore;

namespace Hozelo.Infrastructure.DataAccess.Repositories;

public sealed class UserRepository(HozeloDbContext dbContext) : IUserReadOnlyRepository, IUserWriteOnlyRepository
{
    public async Task Add(User user) => await dbContext.Set<User>().AddAsync(user);

    public Task<bool> ExistsAnyUser() => dbContext.Set<User>().AnyAsync();

    public Task<User?> GetActiveByEmail(string email) =>
        dbContext.Set<User>().AsNoTracking().FirstOrDefaultAsync(u => u.Active && u.Email == email);

    public Task<User?> GetActiveByUserIdentifier(Guid userIdentifier) =>
        dbContext.Set<User>().AsNoTracking().FirstOrDefaultAsync(u => u.Active && u.UserIdentifier == userIdentifier);
}
