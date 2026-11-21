using System.Net;
using CommonTestUtilities.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.User.Register;

public class RegisterUserTest(HozeloWebApplicationFactory factory) : HozeloClassFixture(factory)
{
    private const string Method = "users";

    [Fact]
    public async Task Success()
    {
        var request = RequestRegisterUserJsonBuilder.Build();

        var response = await DoPost(Method, request);

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var json = await ReadJson(response);
        json.GetProperty("name").GetString().ShouldBe(request.Name);
        json.GetProperty("tokens").GetProperty("accessToken").GetString().ShouldNotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Success_Stores_Email_Normalized()
    {
        var request = RequestRegisterUserJsonBuilder.Build();
        var expectedEmail = request.Email;
        request.Email = $" {request.Email.ToUpperInvariant()} ";

        await DoPost(Method, request);

        var storedEmail = await Factory.ExecuteScalarAsync<string>("SELECT email FROM users");
        storedEmail.ShouldBe(expectedEmail);
    }

    [Fact]
    public async Task Error_Second_Registration_Returns_Conflict()
    {
        await DoPost(Method, RequestRegisterUserJsonBuilder.Build());

        var response = await DoPost(Method, RequestRegisterUserJsonBuilder.Build());

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await ReadErrors(response)).ShouldBe([ResourceMessagesException.ACCOUNT_ALREADY_EXISTS]);
        (await Factory.ExecuteScalarAsync<long>("SELECT COUNT(*) FROM users")).ShouldBe(1);
    }

    [Fact]
    public async Task Error_Invalid_Data_Returns_All_Messages_In_Portuguese()
    {
        var request = RequestRegisterUserJsonBuilder.Build(passwordLength: 5);
        request.Name = string.Empty;
        request.Email = "invalido";

        var response = await DoPost(Method, request);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await ReadErrors(response)).ShouldBe(
        [
            ResourceMessagesException.NAME_EMPTY,
            ResourceMessagesException.EMAIL_INVALID,
            ResourceMessagesException.PASSWORD_TOO_SHORT
        ], ignoreOrder: true);
    }
}
