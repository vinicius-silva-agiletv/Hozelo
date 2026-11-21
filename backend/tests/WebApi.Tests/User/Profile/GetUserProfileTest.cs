using System.Net;
using CommonTestUtilities.Requests;
using CommonTestUtilities.Tokens;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.User.Profile;

public class GetUserProfileTest(HozeloWebApplicationFactory factory) : HozeloClassFixture(factory)
{
    private const string Method = "users";

    [Fact]
    public async Task Success()
    {
        var (account, token) = await CreateAccount();

        var response = await DoGet(Method, token);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var json = await ReadJson(response);
        json.GetProperty("name").GetString().ShouldBe(account.Name);
        json.GetProperty("email").GetString().ShouldBe(account.Email);
        json.EnumerateObject().Select(p => p.Name).ShouldBe(["name", "email"], ignoreOrder: true);
    }

    [Fact]
    public async Task Error_Without_Token()
    {
        var response = await DoGet(Method);

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await ReadErrors(response)).ShouldBe([ResourceMessagesException.NO_TOKEN]);
    }

    [Fact]
    public async Task Error_Tampered_Token()
    {
        var (_, token) = await CreateAccount();
        var tampered = token[..^2] + (token.EndsWith("AA") ? "BB" : "AA");

        await ShouldBeInvalidSession(tampered);
    }

    [Fact]
    public async Task Error_Token_Signed_With_Other_Key()
    {
        await CreateAccount();
        var foreign = JwtTokenGeneratorBuilder
            .Build("outra-chave-qualquer-com-mais-de-32-caracteres", Factory.TimeProvider)
            .Generate(Guid.NewGuid());

        await ShouldBeInvalidSession(foreign);
    }

    [Fact]
    public async Task Error_Expired_Token()
    {
        var (_, token) = await CreateAccount();

        Factory.TimeProvider.Advance(TimeSpan.FromDays(7));

        await ShouldBeInvalidSession(token);
    }

    [Fact]
    public async Task Error_Token_Of_Removed_Account()
    {
        var (_, token) = await CreateAccount();

        await Factory.ResetDatabaseAsync();

        await ShouldBeInvalidSession(token);
    }

    private async Task ShouldBeInvalidSession(string token)
    {
        var response = await DoGet(Method, token);

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await ReadErrors(response)).ShouldBe([ResourceMessagesException.INVALID_SESSION]);
    }

    private async Task<(RequestRegisterUserJson account, string token)> CreateAccount()
    {
        var request = RequestRegisterUserJsonBuilder.Build();
        var response = await DoPost(Method, request);
        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var json = await ReadJson(response);
        return (request, json.GetProperty("tokens").GetProperty("accessToken").GetString()!);
    }
}
