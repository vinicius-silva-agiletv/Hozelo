using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.LoginThrottle;
using Microsoft.EntityFrameworkCore;

namespace Hozelo.Infrastructure.DataAccess.Repositories;

/// <summary>Atualizações atômicas no banco (research.md §7, máquina de estados em data-model.md).</summary>
public sealed class LoginThrottleRepository(HozeloDbContext dbContext) : ILoginThrottleRepository
{
    public Task<LoginThrottle> Get() =>
        dbContext.Set<LoginThrottle>().AsNoTracking().SingleAsync(t => t.Id == LoginThrottle.SingletonId);

    public Task RegisterFailure(int maxFailedAttempts, DateTime lockUntilUtc)
    {
        return dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE login_throttle SET
                locked_until_utc = CASE WHEN failed_attempts + 1 >= {maxFailedAttempts}
                                        THEN {lockUntilUtc} ELSE locked_until_utc END,
                failed_attempts  = CASE WHEN failed_attempts + 1 >= {maxFailedAttempts}
                                        THEN 0 ELSE failed_attempts + 1 END
            WHERE id = {LoginThrottle.SingletonId}
            """);
    }

    public Task Reset()
    {
        return dbContext.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE login_throttle SET failed_attempts = 0 WHERE id = {LoginThrottle.SingletonId}");
    }
}
