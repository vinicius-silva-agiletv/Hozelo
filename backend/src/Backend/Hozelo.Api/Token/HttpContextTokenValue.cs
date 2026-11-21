using Hozelo.Domain.Security.Tokens;

namespace Hozelo.Api.Token;

public sealed class HttpContextTokenValue(IHttpContextAccessor httpContextAccessor) : ITokenProvider
{
    private const string BearerPrefix = "Bearer ";

    public string Value() => Read(httpContextAccessor.HttpContext) ?? string.Empty;

    /// <summary>Token do header Authorization (formato "Bearer x"), ou null se ausente.</summary>
    public static string? Read(HttpContext? context)
    {
        var header = context?.Request.Headers.Authorization.ToString();

        if (string.IsNullOrWhiteSpace(header) || !header.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase))
            return null;

        var token = header[BearerPrefix.Length..].Trim();

        return token.Length == 0 ? null : token;
    }
}
