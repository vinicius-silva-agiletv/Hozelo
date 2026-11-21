namespace Hozelo.Application.Settings;

public sealed class LoginLockoutSettings
{
    public const string Section = "Settings:LoginLockout";

    public int MaxFailedAttempts { get; init; } = 5;

    public int LockoutMinutes { get; init; } = 15;
}
