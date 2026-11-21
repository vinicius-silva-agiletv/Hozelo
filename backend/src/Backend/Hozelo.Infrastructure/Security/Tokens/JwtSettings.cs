using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Hozelo.Infrastructure.Security.Tokens;

public sealed class JwtSettings
{
    public const string Section = "Settings:Jwt";

    /// <summary>Nome da claim que carrega o UserIdentifier.</summary>
    public const string UserIdentifierClaim = "sid";

    private const int MinimumKeyLength = 32;

    public string SigningKey { get; init; } = string.Empty;

    public int ExpirationTimeMinutes { get; init; } = 10080;

    public SymmetricSecurityKey SecurityKey() => new(Encoding.UTF8.GetBytes(SigningKey));

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(SigningKey) || SigningKey.Length < MinimumKeyLength)
            throw new InvalidOperationException(
                $"{Section}:SigningKey deve ter pelo menos {MinimumKeyLength} caracteres. Defina via user-secrets ou variável de ambiente.");

        if (ExpirationTimeMinutes <= 0)
            throw new InvalidOperationException($"{Section}:ExpirationTimeMinutes deve ser maior que zero.");
    }
}
