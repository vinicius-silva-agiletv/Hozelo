using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.LoginThrottle;

namespace CommonTestUtilities.Repositories;

public static class LoginThrottleRepositoryBuilder
{
    /// <summary>Fake em memória com a mesma máquina de estados da implementação real.</summary>
    public static InMemoryLoginThrottleRepository Build() => new();

    public sealed class InMemoryLoginThrottleRepository : ILoginThrottleRepository
    {
        public LoginThrottle State { get; } = new();

        public Task<LoginThrottle> Get() => Task.FromResult(new LoginThrottle
        {
            FailedAttempts = State.FailedAttempts,
            LockedUntilUtc = State.LockedUntilUtc
        });

        public Task RegisterFailure(int maxFailedAttempts, DateTime lockUntilUtc)
        {
            if (State.FailedAttempts + 1 >= maxFailedAttempts)
            {
                State.LockedUntilUtc = lockUntilUtc;
                State.FailedAttempts = 0;
            }
            else
            {
                State.FailedAttempts++;
            }

            return Task.CompletedTask;
        }

        public Task Reset()
        {
            State.FailedAttempts = 0;
            return Task.CompletedTask;
        }
    }
}
