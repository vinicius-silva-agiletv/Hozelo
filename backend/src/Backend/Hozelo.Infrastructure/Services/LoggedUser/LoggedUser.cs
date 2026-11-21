using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.User;
using Hozelo.Domain.Security.Tokens;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Infrastructure.Services.LoggedUser;

public sealed class LoggedUser(
    ITokenProvider tokenProvider,
    IAccessTokenValidator tokenValidator,
    IUserReadOnlyRepository userRepository) : ILoggedUser
{
    public async Task<User> User()
    {
        var userIdentifier = tokenValidator.ValidateAndGetUserIdentifier(tokenProvider.Value());

        return await userRepository.GetActiveByUserIdentifier(userIdentifier)
            ?? throw new UnauthorizedException(ResourceMessagesException.INVALID_SESSION);
    }
}
