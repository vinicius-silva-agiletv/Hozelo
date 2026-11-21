using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.User;
using Hozelo.Domain.Security.Cryptography;
using Hozelo.Domain.Security.Tokens;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.User.Register;

public sealed class RegisterUserUseCase(
    IUserReadOnlyRepository readOnlyRepository,
    IUserWriteOnlyRepository writeOnlyRepository,
    IUnitOfWork unitOfWork,
    IPasswordEncripter passwordEncripter,
    IAccessTokenGenerator accessTokenGenerator,
    TimeProvider timeProvider) : IRegisterUserUseCase
{
    public async Task<ResponseRegisteredUserJson> Execute(RequestRegisterUserJson request)
    {
        // Conta existente prevalece sobre dados inválidos (spec, Edge Cases).
        if (await readOnlyRepository.ExistsAnyUser())
            throw new AccountAlreadyExistsException();

        Normalize(request);
        Validate(request);

        var user = new Domain.Entities.User
        {
            UserIdentifier = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            Password = passwordEncripter.Encrypt(request.Password),
            CreatedOn = timeProvider.GetUtcNow().UtcDateTime
        };

        await writeOnlyRepository.Add(user);
        await unitOfWork.Commit();

        return new ResponseRegisteredUserJson
        {
            Name = user.Name,
            Tokens = new ResponseTokensJson { AccessToken = accessTokenGenerator.Generate(user.UserIdentifier) }
        };
    }

    private static void Normalize(RequestRegisterUserJson request)
    {
        request.Name = request.Name?.Trim() ?? string.Empty;
        request.Email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        request.Password ??= string.Empty;
    }

    private static void Validate(RequestRegisterUserJson request)
    {
        var result = new RegisterUserValidator().Validate(request);

        if (!result.IsValid)
            throw new ErrorOnValidationException(result.Errors.Select(e => e.ErrorMessage).ToList());
    }
}
