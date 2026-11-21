using System.Net;
using System.Text.Json;
using CommonTestUtilities.Requests;
using Hozelo.Communication.Requests;
using Shouldly;

namespace WebApi.Tests;

/// <summary>Helpers dos testes de categorias, despesas e parcelas (conta já cadastrada).</summary>
public abstract class FinanceTestBase(HozeloWebApplicationFactory factory) : HozeloClassFixture(factory)
{
    private static readonly TimeZoneInfo FamilyTimeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

    /// <summary>"Hoje" como a API enxerga (FakeTimeProvider + fuso da família).</summary>
    protected DateOnly Today() =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(Factory.TimeProvider.GetUtcNow(), FamilyTimeZone).DateTime);

    protected DateOnly FirstOfMonth(int monthsFromNow)
    {
        var today = Today();
        return new DateOnly(today.Year, today.Month, 1).AddMonths(monthsFromNow);
    }

    protected async Task<long> CreateCategory(string token, string? name = null)
    {
        var response = await DoPost("categories", RequestCategoryJsonBuilder.Build(name), token);
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        return (await ReadJson(response)).GetProperty("id").GetInt64();
    }

    protected async Task<JsonElement> CreateExpense(string token, RequestRegisterExpenseJson request)
    {
        var response = await DoPost("expenses", request, token);
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        return await ReadJson(response);
    }

    protected static IList<JsonElement> Items(JsonElement json, string property) =>
        json.GetProperty(property).EnumerateArray().ToList();
}
