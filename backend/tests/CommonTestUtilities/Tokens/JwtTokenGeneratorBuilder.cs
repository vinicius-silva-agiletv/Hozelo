using Hozelo.Domain.Security.Tokens;
using Hozelo.Infrastructure.Security.Tokens;

namespace CommonTestUtilities.Tokens;

public static class JwtTokenGeneratorBuilder
{
    /// <summary>Gerador real de JWT, útil para montar tokens válidos ou assinados com outra chave.</summary>
    public static IAccessTokenGenerator Build(string signingKey, TimeProvider? timeProvider = null)
    {
        var settings = new JwtSettings { SigningKey = signingKey, ExpirationTimeMinutes = 10080 };
        return new JwtTokenGenerator(settings, timeProvider ?? TimeProvider.System);
    }
}
