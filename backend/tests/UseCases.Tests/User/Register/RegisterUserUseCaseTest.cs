using CommonTestUtilities.Cryptography;
using CommonTestUtilities.Repositories;
using CommonTestUtilities.Requests;
using CommonTestUtilities.Tokens;
using Hozelo.Application.UseCases.User.Register;
using Hozelo.Communication.Requests;
using Hozelo.Domain.Repositories.User;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Microsoft.Extensions.Time.Testing;
using Moq;
using Shouldly;
using UserEntity = Hozelo.Domain.Entities.User;

namespace UseCases.Tests.User.Register;

public class RegisterUserUseCaseTest
{
    private readonly Mock<IUserWriteOnlyRepository> _writeRepository = UserWriteOnlyRepositoryBuilder.Build();

    [Fact]
    public async Task Success()
    {
        var request = RequestRegisterUserJsonBuilder.Build();

        var result = await CreateUseCase().Execute(request);

        result.Name.ShouldBe(request.Name);
        result.Tokens.AccessToken.ShouldStartWith("token-");
        _writeRepository.Verify(r => r.Add(It.IsAny<UserEntity>()), Times.Once);
    }

    [Fact]
    public async Task Success_Normalizes_Name_And_Email_And_Hashes_Password()
    {
        var request = RequestRegisterUserJsonBuilder.Build();
        var expectedEmail = request.Email;
        var expectedName = request.Name;
        request.Email = $"  {request.Email.ToUpperInvariant()}  ";
        request.Name = $"  {request.Name}  ";

        UserEntity? saved = null;
        _writeRepository.Setup(r => r.Add(It.IsAny<UserEntity>())).Callback<UserEntity>(u => saved = u);

        await CreateUseCase().Execute(request);

        saved.ShouldNotBeNull();
        saved.Email.ShouldBe(expectedEmail);
        saved.Name.ShouldBe(expectedName);
        saved.Password.ShouldBe(PasswordEncripterBuilder.Build().Encrypt(request.Password));
        saved.UserIdentifier.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task Error_Account_Already_Exists()
    {
        var useCase = CreateUseCase(new UserReadOnlyRepositoryBuilder().ExistsAnyUser());

        var act = () => useCase.Execute(RequestRegisterUserJsonBuilder.Build());

        var exception = await act.ShouldThrowAsync<AccountAlreadyExistsException>();
        exception.GetErrorMessages().ShouldBe([ResourceMessagesException.ACCOUNT_ALREADY_EXISTS]);
        _writeRepository.Verify(r => r.Add(It.IsAny<UserEntity>()), Times.Never);
    }

    [Fact]
    public async Task Error_Account_Already_Exists_Prevails_Over_Invalid_Data()
    {
        var useCase = CreateUseCase(new UserReadOnlyRepositoryBuilder().ExistsAnyUser());

        var act = () => useCase.Execute(new RequestRegisterUserJson());

        await act.ShouldThrowAsync<AccountAlreadyExistsException>();
    }

    [Fact]
    public async Task Error_Invalid_Data_Returns_All_Messages()
    {
        var request = RequestRegisterUserJsonBuilder.Build(passwordLength: 4);
        request.Name = string.Empty;

        var act = () => CreateUseCase().Execute(request);

        var exception = await act.ShouldThrowAsync<ErrorOnValidationException>();
        exception.GetErrorMessages().ShouldBe(
            [ResourceMessagesException.NAME_EMPTY, ResourceMessagesException.PASSWORD_TOO_SHORT],
            ignoreOrder: true);
        _writeRepository.Verify(r => r.Add(It.IsAny<UserEntity>()), Times.Never);
    }

    private RegisterUserUseCase CreateUseCase(UserReadOnlyRepositoryBuilder? readRepository = null)
    {
        return new RegisterUserUseCase(
            (readRepository ?? new UserReadOnlyRepositoryBuilder()).Build(),
            _writeRepository.Object,
            UnitOfWorkBuilder.Build(),
            PasswordEncripterBuilder.Build(),
            AccessTokenGeneratorBuilder.Build(),
            new FakeTimeProvider());
    }
}
