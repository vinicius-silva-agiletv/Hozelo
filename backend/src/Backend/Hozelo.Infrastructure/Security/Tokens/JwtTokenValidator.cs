using System.IdentityModel.Tokens.Jwt;
using Hozelo.Domain.Security.Tokens;
using Microsoft.IdentityModel.Tokens;

namespace Hozelo.Infrastructure.Security.Tokens;

/// <summary>Valida assinatura e expiração do JWT usando o relógio da aplicação (research.md §2).</summary>
public sealed class JwtTokenValidator(JwtSettings settings, TimeProvider timeProvider) : IAccessTokenValidator
{
    public Guid ValidateAndGetUserIdentifier(string token)
    {
        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = settings.SecurityKey(),
            RequireExpirationTime = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            LifetimeValidator = IsWithinLifetime
        };

        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
        var principal = handler.ValidateToken(token, parameters, out _);

        var claim = principal.FindFirst(JwtSettings.UserIdentifierClaim)?.Value;

        return Guid.TryParse(claim, out var userIdentifier)
            ? userIdentifier
            : throw new SecurityTokenException("Token sem identificador de usuário válido.");
    }

    private bool IsWithinLifetime(
        DateTime? notBefore, DateTime? expires, SecurityToken token, TokenValidationParameters parameters)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;

        return expires is not null
            && expires.Value > now
            && (notBefore is null || notBefore.Value <= now);
    }
}
