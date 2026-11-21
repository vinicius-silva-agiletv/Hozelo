using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace WebApi.Tests;

/// <summary>
/// Base dos testes de integração: limpa o banco antes de cada teste e oferece helpers HTTP.
/// </summary>
[Collection(WebApiCollection.Name)]
public abstract class HozeloClassFixture(HozeloWebApplicationFactory factory) : IAsyncLifetime
{
    private readonly HttpClient _httpClient = factory.CreateClient();

    protected HozeloWebApplicationFactory Factory { get; } = factory;

    public Task InitializeAsync() => Factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    protected Task<HttpResponseMessage> DoPost(string url, object request) =>
        _httpClient.PostAsJsonAsync(url, request);

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
