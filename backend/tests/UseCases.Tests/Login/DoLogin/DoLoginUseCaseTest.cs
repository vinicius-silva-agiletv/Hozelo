using CommonTestUtilities.Cryptography;
using CommonTestUtilities.Entities;
using CommonTestUtilities.Repositories;
using CommonTestUtilities.Requests;
using CommonTestUtilities.Tokens;
using Hozelo.Application.Settings;
using Hozelo.Application.UseCases.Login.DoLogin;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Microsoft.Extensions.Time.Testing;
using Shouldly;
using UserEntity = Hozelo.Domain.Entities.User;

namespace UseCases.Tests.Login.DoLogin;

public class DoLoginUseCaseTest
{
    private readonly LoginLockoutSettings _settings = new() { MaxFailedAttempts = 5, LockoutMinutes = 15 };
    private readonly FakeTimeProvider _time = new(DateTimeOffset.UtcNow);
    private readonly LoginThrottleRepositoryBuilder.InMemoryLoginThrottleRepository _throttle = LoginThrottleRepositoryBuilder.Build();
    private readonly (UserEntity user, string password) _account = UserBuilder.Build();

    [Fact]
    public async Task Success()
    {
        var result = await CreateUseCase().Execute(RequestLoginJsonBuilder.Build(_account.user.Email, _account.password));

        result.Name.ShouldBe(_account.user.Name);
        result.Tokens.AccessToken.ShouldBe($"token-{_account.user.UserIdentifier}");
    }

    [Fact]
    public async Task Success_Normalizes_Email()
    {
        var email = $"  {_account.user.Email.ToUpperInvariant()}  ";

        var result = await CreateUseCase().Execute(RequestLoginJsonBuilder.Build(email, _account.password));

        result.Name.ShouldBe(_account.user.Name);
    }

    [Fact]
    public async Task Success_Resets_Failed_Attempts()
    {
        _throttle.State.FailedAttempts = 3;

        await CreateUseCase().Execute(RequestLoginJsonBuilder.Build(_account.user.Email, _account.password));

        _throttle.State.FailedAttempts.ShouldBe(0);
    }

    [Fact]
    public async Task Error_Wrong_Password_And_Unknown_Email_Return_Same_Message()
    {
        var wrongPassword = () => CreateUseCase().Execute(RequestLoginJsonBuilder.Build(_account.user.Email, "senha-errada"));
        var unknownEmail = () => CreateUseCase().Execute(RequestLoginJsonBuilder.Build("ninguem@exemplo.com", _account.password));

        var first = await wrongPassword.ShouldThrowAsync<InvalidLoginException>();
        var second = await unknownEmail.ShouldThrowAsync<InvalidLoginException>();

        first.GetErrorMessages().ShouldBe([ResourceMessagesException.EMAIL_OR_PASSWORD_INVALID]);
        second.GetErrorMessages().ShouldBe(first.GetErrorMessages());
        _throttle.State.FailedAttempts.ShouldBe(2); // e-mail inexistente também conta
    }

    [Theory]
    [InlineData("", "")]
    [InlineData("   ", "qualquer")]
    [InlineData("alguem@exemplo.com", "")]
    public async Task Error_Empty_Fields_Return_Generic_Message(string email, string password)
    {
        var act = () => CreateUseCase().Execute(RequestLoginJsonBuilder.Build(email, password));

        await act.ShouldThrowAsync<InvalidLoginException>();
    }

    [Fact]
    public async Task Error_Fifth_Failure_Locks_Login_Even_With_Correct_Password()
    {
        await FailTimes(5);

        var act = () => CreateUseCase().Execute(RequestLoginJsonBuilder.Build(_account.user.Email, _account.password));

        var exception = await act.ShouldThrowAsync<TooManyLoginAttemptsException>();
        exception.GetErrorMessages().ShouldBe([ResourceMessagesException.TOO_MANY_LOGIN_ATTEMPTS]);
    }

    [Fact]
    public async Task Error_Fourth_Failure_Does_Not_Lock()
    {
        await FailTimes(4);

        var result = await CreateUseCase().Execute(RequestLoginJsonBuilder.Build(_account.user.Email, _account.password));

        result.Name.ShouldBe(_account.user.Name);
    }

    [Fact]
    public async Task Attempts_During_Lock_Do_Not_Extend_It()
    {
        await FailTimes(5);
        var lockedUntil = _throttle.State.LockedUntilUtc;

        _time.Advance(TimeSpan.FromMinutes(10));
        var act = () => CreateUseCase().Execute(RequestLoginJsonBuilder.Build(_account.user.Email, "senha-errada"));
        await act.ShouldThrowAsync<TooManyLoginAttemptsException>();

        _throttle.State.LockedUntilUtc.ShouldBe(lockedUntil);
    }

    [Fact]
    public async Task Success_After_Lock_Expires()
    {
        await FailTimes(5);

        _time.Advance(TimeSpan.FromMinutes(15));

        var result = await CreateUseCase().Execute(RequestLoginJsonBuilder.Build(_account.user.Email, _account.password));
        result.Name.ShouldBe(_account.user.Name);
    }

    private async Task FailTimes(int times)
    {
        for (var i = 0; i < times; i++)
        {
            var act = () => CreateUseCase().Execute(RequestLoginJsonBuilder.Build(_account.user.Email, "senha-errada"));
            await act.ShouldThrowAsync<InvalidLoginException>();
        }
    }

    private DoLoginUseCase CreateUseCase()
    {
        return new DoLoginUseCase(
            new UserReadOnlyRepositoryBuilder().GetActiveByEmail(_account.user).Build(),
            _throttle,
            PasswordEncripterBuilder.Build(),
            AccessTokenGeneratorBuilder.Build(),
            _time,
            _settings);
    }
}
