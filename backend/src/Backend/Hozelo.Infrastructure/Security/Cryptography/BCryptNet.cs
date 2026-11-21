using Hozelo.Domain.Security.Cryptography;

namespace Hozelo.Infrastructure.Security.Cryptography;

/// <summary>Hash de senha com BCrypt (research.md §1).</summary>
public sealed class BCryptNet : IPasswordEncripter
{
    private const int WorkFactor = 12;

    public string Encrypt(string password) => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool IsValid(string password, string passwordHash) => BCrypt.Net.BCrypt.Verify(password, passwordHash);
}
