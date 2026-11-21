using System.Net;
using CommonTestUtilities.Requests;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.Login.DoLogin;

public class DoLoginTest(HozeloWebApplicationFactory factory) : HozeloClassFixture(factory)
{
    private const string Method = "login";

    [Fact]
    public async Task Success()
    {
        var account = await CreateAccount();

        var response = await DoPost(Method, RequestLoginJsonBuilder.Build(account.Email, account.Password));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var json = await ReadJson(response);
        json.GetProperty("name").GetString().ShouldBe(account.Name);
        json.GetProperty("tokens").GetProperty("accessToken").GetString().ShouldNotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Success_Email_With_Uppercase_And_Spaces()
    {
        var account = await CreateAccount();

        var response = await DoPost(Method, RequestLoginJsonBuilder.Build($" {account.Email.ToUpperInvariant()} ", account.Password));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Error_Wrong_Password_And_Unknown_Email_Return_Same_401()
    {
        var account = await CreateAccount();

        var wrongPassword = await DoPost(Method, RequestLoginJsonBuilder.Build(account.Email, "senha-errada"));
        var unknownEmail = await DoPost(Method, RequestLoginJsonBuilder.Build("ninguem@exemplo.com", account.Password));

        wrongPassword.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        unknownEmail.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await ReadErrors(wrongPassword)).ShouldBe([ResourceMessagesException.EMAIL_OR_PASSWORD_INVALID]);
        (await ReadErrors(unknownEmail)).ShouldBe([ResourceMessagesException.EMAIL_OR_PASSWORD_INVALID]);
    }

    [Fact]
    public async Task Error_Locked_After_5_Failures_Then_Unlocked_After_15_Minutes()
    {
        var account = await CreateAccount();

        for (var i = 0; i < 5; i++)
            (await DoPost(Method, RequestLoginJsonBuilder.Build(account.Email, "senha-errada")))
                .StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

        var locked = await DoPost(Method, RequestLoginJsonBuilder.Build(account.Email, account.Password));

        locked.StatusCode.ShouldBe(HttpStatusCode.TooManyRequests);
        (await ReadErrors(locked)).ShouldBe([ResourceMessagesException.TOO_MANY_LOGIN_ATTEMPTS]);

        Factory.TimeProvider.Advance(TimeSpan.FromMinutes(15));

        var unlocked = await DoPost(Method, RequestLoginJsonBuilder.Build(account.Email, account.Password));
        unlocked.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    private async Task<RequestRegisterUserJson> CreateAccount()
    {
        var request = RequestRegisterUserJsonBuilder.Build();
        (await DoPost("users", request)).StatusCode.ShouldBe(HttpStatusCode.Created);
        return request;
    }
}
