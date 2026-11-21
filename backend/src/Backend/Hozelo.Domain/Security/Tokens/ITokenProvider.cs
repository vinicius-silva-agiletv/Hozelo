namespace Hozelo.Domain.Security.Tokens;

/// <summary>Fornece o token de acesso da requisição atual.</summary>
public interface ITokenProvider
{
    string Value();
}
