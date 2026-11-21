namespace Hozelo.Domain.Repositories.LoginThrottle;

/// <summary>
/// Operações atômicas sobre o controle de tentativas. Gravam imediatamente,
/// sem depender do IUnitOfWork, para não haver perda de contagem sob concorrência.
/// </summary>
public interface ILoginThrottleRepository
{
    Task<Entities.LoginThrottle> Get();

    /// <summary>
    /// Soma uma falha. Ao atingir <paramref name="maxFailedAttempts"/>, bloqueia até
    /// <paramref name="lockUntilUtc"/> e zera a contagem.
    /// </summary>
    Task RegisterFailure(int maxFailedAttempts, DateTime lockUntilUtc);

    Task Reset();
}
