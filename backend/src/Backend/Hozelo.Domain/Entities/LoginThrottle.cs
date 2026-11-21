namespace Hozelo.Domain.Entities;

/// <summary>Controle global de tentativas de login (linha única, Id = 1).</summary>
public class LoginThrottle
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;

    public int FailedAttempts { get; set; }

    public DateTime? LockedUntilUtc { get; set; }

    public bool IsLocked(DateTime nowUtc) => LockedUntilUtc > nowUtc;
}
