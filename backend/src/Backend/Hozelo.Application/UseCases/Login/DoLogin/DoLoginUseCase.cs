using Hozelo.Application.Settings;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories.LoginThrottle;
using Hozelo.Domain.Repositories.User;
using Hozelo.Domain.Security.Cryptography;
using Hozelo.Domain.Security.Tokens;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Login.DoLogin;

public sealed class DoLoginUseCase(
    IUserReadOnlyRepository userRepository,
    ILoginThrottleRepository throttleRepository,
    IPasswordEncripter passwordEncripter,
    IAccessTokenGenerator accessTokenGenerator,
    TimeProvider timeProvider,
    LoginLockoutSettings settings) : IDoLoginUseCase
{
    public async Task<ResponseRegisteredUserJson> Execute(RequestLoginJson request)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;

        var throttle = await throttleRepository.Get();
        if (throttle.IsLocked(now))
            throw new TooManyLoginAttemptsException();

        var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var password = request.Password ?? string.Empty;

        var user = await FindUserWithValidPassword(email, password);
        if (user is null)
        {
            await throttleRepository.RegisterFailure(settings.MaxFailedAttempts, now.AddMinutes(settings.LockoutMinutes));
            throw new InvalidLoginException();
        }

        if (throttle.FailedAttempts > 0)
            await throttleRepository.Reset();

        return new ResponseRegisteredUserJson
        {
            Name = user.Name,
            Tokens = new ResponseTokensJson { AccessToken = accessTokenGenerator.Generate(user.UserIdentifier) }
        };
    }

    private async Task<Domain.Entities.User?> FindUserWithValidPassword(string email, string password)
    {
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            return null;

        var user = await userRepository.GetActiveByEmail(email);

        if (user is null)
        {
            // Gasta o mesmo tempo de uma verificação real, para o tempo de resposta
            // não revelar se o e-mail existe (SC-005).
            passwordEncripter.Encrypt(password);
            return null;
        }

        return passwordEncripter.IsValid(password, user.Password) ? user : null;
    }
}
