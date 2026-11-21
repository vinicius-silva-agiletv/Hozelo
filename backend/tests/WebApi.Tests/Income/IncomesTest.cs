using System.Net;
using CommonTestUtilities.Requests;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.Income;

public class IncomesTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task Crud_And_Receipt()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token, "13º salário", CategoryType.Income);

        var created = await DoPost("incomes", RequestIncomeJsonBuilder.Build(category), token);
        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        var id = (await ReadJson(created)).GetProperty("id").GetInt64();

        var update = RequestIncomeJsonBuilder.Build(category, 2600m, new DateOnly(2026, 12, 20));
        var updated = await ReadJson(await DoPut($"incomes/{id}", update, token));
        updated.GetProperty("amount").GetDecimal().ShouldBe(2600m);
        updated.GetProperty("expectedDate").GetString().ShouldBe("2026-12-20");

        var received = await ReadJson(await DoPost($"incomes/{id}/receipt", null, token));
        received.GetProperty("isReceived").GetBoolean().ShouldBeTrue();
        received.GetProperty("receivedOn").GetString().ShouldBe(Today().ToString("yyyy-MM-dd"));
        var undone = await ReadJson(await DoDelete($"incomes/{id}/receipt", token));
        undone.GetProperty("isReceived").GetBoolean().ShouldBeFalse();

        var december = await ReadJson(await DoGet("incomes?year=2026&month=12", token));
        Items(december, "incomes").Count.ShouldBe(1);
        var november = await ReadJson(await DoGet("incomes?year=2026&month=11", token));
        Items(november, "incomes").ShouldBeEmpty();

        (await DoDelete($"incomes/{id}", token)).StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await DoGet($"incomes/{id}", token)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Errors()
    {
        var token = await CreateAccountAndGetToken();
        var expenseCategory = await CreateCategory(token, "Carro");

        var invalid = await DoPost("incomes", new RequestIncomeJson { CategoryId = expenseCategory }, token);
        invalid.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await ReadErrors(invalid)).ShouldBe(
        [
            ResourceMessagesException.NAME_EMPTY,
            ResourceMessagesException.AMOUNT_MUST_BE_POSITIVE,
            ResourceMessagesException.EXPECTED_DATE_EMPTY,
            ResourceMessagesException.CATEGORY_NOT_INCOME
        ], ignoreOrder: true);

        var month = await DoGet("incomes?year=2026", token);
        (await ReadErrors(month)).ShouldBe([ResourceMessagesException.MONTH_INVALID]);
        (await DoPost("incomes/999/receipt", null, token)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await DoGet("incomes")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Category_With_Income_Cannot_Be_Removed()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token, "13º salário", CategoryType.Income);
        await DoPost("incomes", RequestIncomeJsonBuilder.Build(category), token);

        var response = await DoDelete($"categories/{category}", token);

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await ReadErrors(response)).ShouldBe([ResourceMessagesException.CATEGORY_HAS_ENTRIES]);
    }
}
