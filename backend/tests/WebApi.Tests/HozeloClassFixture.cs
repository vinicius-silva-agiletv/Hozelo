using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using CommonTestUtilities.Requests;

namespace WebApi.Tests;

/// <summary>
/// Base dos testes de integração: limpa o banco antes de cada teste e oferece helpers HTTP.
/// </summary>
[Collection(WebApiCollection.Name)]
public abstract class HozeloClassFixture(HozeloWebApplicationFactory factory) : IAsyncLifetime
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly HttpClient _httpClient = factory.CreateClient();

    protected HozeloWebApplicationFactory Factory { get; } = factory;

    public Task InitializeAsync() => Factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    protected Task<HttpResponseMessage> DoPost(string url, object request) =>
        _httpClient.PostAsJsonAsync(url, request);

    protected Task<HttpResponseMessage> DoPost(string url, object? request, string token) =>
        Send(HttpMethod.Post, url, request, token);

    protected Task<HttpResponseMessage> DoPut(string url, object request, string token) =>
        Send(HttpMethod.Put, url, request, token);

    protected Task<HttpResponseMessage> DoDelete(string url, string token) =>
        Send(HttpMethod.Delete, url, null, token);

    /// <summary>Cadastra a conta da família e devolve o token de acesso.</summary>
    protected async Task<string> CreateAccountAndGetToken()
    {
        var response = await DoPost("users", RequestRegisterUserJsonBuilder.Build());
        var json = await ReadJson(response);
        return json.GetProperty("tokens").GetProperty("accessToken").GetString()!;
    }

    private Task<HttpResponseMessage> Send(HttpMethod method, string url, object? request, string token)
    {
        var message = new HttpRequestMessage(method, url);
        message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        if (request is not null)
            message.Content = JsonContent.Create(request, options: JsonOptions);

        return _httpClient.SendAsync(message);
    }

    protected Task<HttpResponseMessage> DoGet(string url, string? token = null)
    {
        var message = new HttpRequestMessage(HttpMethod.Get, url);

        if (!string.IsNullOrEmpty(token))
            message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        return _httpClient.SendAsync(message);
    }

    protected static async Task<JsonElement> ReadJson(HttpResponseMessage response)
    {
        await using var body = await response.Content.ReadAsStreamAsync();
        var document = await JsonDocument.ParseAsync(body);
        return document.RootElement.Clone();
    }

    protected static async Task<IList<string>> ReadErrors(HttpResponseMessage response)
    {
        var json = await ReadJson(response);
        return json.GetProperty("errors").EnumerateArray().Select(e => e.GetString()!).ToList();
    }
}
