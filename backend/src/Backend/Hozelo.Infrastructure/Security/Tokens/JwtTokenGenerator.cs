using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Hozelo.Domain.Security.Tokens;
using Microsoft.IdentityModel.Tokens;

namespace Hozelo.Infrastructure.Security.Tokens;

/// <summary>Gera o JWT de acesso (research.md §2).</summary>
public sealed class JwtTokenGenerator(JwtSettings settings, TimeProvider timeProvider) : IAccessTokenGenerator
{
    public string Generate(Guid userIdentifier)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([new Claim(JwtSettings.UserIdentifierClaim, userIdentifier.ToString())]),
            IssuedAt = now,
            NotBefore = now,
            Expires = now.AddMinutes(settings.ExpirationTimeMinutes),
            SigningCredentials = new SigningCredentials(settings.SecurityKey(), SecurityAlgorithms.HmacSha256Signature)
        };

        var handler = new JwtSecurityTokenHandler { SetDefaultTimesOnTokenCreation = false, MapInboundClaims = false };
        handler.OutboundClaimTypeMap.Clear();

        return handler.WriteToken(handler.CreateToken(descriptor));
    }
}
