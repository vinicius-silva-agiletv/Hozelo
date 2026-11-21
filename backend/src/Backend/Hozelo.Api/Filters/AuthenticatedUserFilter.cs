using Hozelo.Api.Token;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories.User;
using Hozelo.Domain.Security.Tokens;
using Hozelo.Exception;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Hozelo.Api.Filters;

/// <summary>
/// Exige token válido de uma conta existente e ativa. Responde 401 em português.
/// Filtros de autorização não passam pelo ExceptionFilter, por isso o resultado é montado aqui.
/// </summary>
public sealed class AuthenticatedUserFilter(
    IAccessTokenValidator tokenValidator,
    IUserReadOnlyRepository userRepository) : IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var token = HttpContextTokenValue.Read(context.HttpContext);

        if (token is null)
        {
            context.Result = Unauthorized(ResourceMessagesException.NO_TOKEN);
            return;
        }

        if (!await IsValidSession(token))
            context.Result = Unauthorized(ResourceMessagesException.INVALID_SESSION);
    }

    private async Task<bool> IsValidSession(string token)
    {
        Guid userIdentifier;

        try
        {
            userIdentifier = tokenValidator.ValidateAndGetUserIdentifier(token);
        }
        catch (System.Exception)
        {
            return false; // assinatura inválida, adulterado, expirado ou malformado
        }

        return await userRepository.GetActiveByUserIdentifier(userIdentifier) is not null;
    }

    private static UnauthorizedObjectResult Unauthorized(string message) => new(new ResponseErrorJson(message));
}
