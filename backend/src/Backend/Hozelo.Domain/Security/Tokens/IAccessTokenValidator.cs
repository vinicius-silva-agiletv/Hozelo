namespace Hozelo.Domain.Security.Tokens;

public interface IAccessTokenValidator
{
    /// <summary>Valida assinatura e expiração; lança exceção se o token for inválido.</summary>
    Guid ValidateAndGetUserIdentifier(string token);
}
