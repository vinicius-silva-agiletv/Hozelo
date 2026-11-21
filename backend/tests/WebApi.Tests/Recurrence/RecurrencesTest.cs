using System.Net;
using CommonTestUtilities.Requests;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.Recurrence;

public class RecurrencesTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task Salary_Lifecycle()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token, "Salário", CategoryType.Income);

        var created = await DoPost("recurrences", RequestRecurrenceJsonBuilder.Salary(category), token);
        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        var json = await ReadJson(created);
        var id = json.GetProperty("id").GetInt64();
        json.GetProperty("kind").GetString().ShouldBe("Income");
        json.GetProperty("isActive").GetBoolean().ShouldBeTrue();

        await DoPut($"recurrences/{id}/months/2026/12", new RequestAdjustRecurrenceMonthJson { Amount = 5400 }, token);
        await DoPut($"recurrences/{id}/months/2026/10", new RequestAdjustRecurrenceMonthJson { Skipped = true }, token);
        await DoPost($"recurrences/{id}/months/2026/11/settlement", null, token);
        await DoPut($"recurrences/{id}/amount", new RequestChangeRecurrenceAmountJson { Amount = 6600, FromMonth = "2027-03" }, token);
        var ended = await ReadJson(await DoPut($"recurrences/{id}/end", new RequestEndRecurrenceJson { EndMonth = "2027-06" }, token));

        ended.GetProperty("endMonth").GetString().ShouldBe("2027-06");
        Items(ended, "amounts").Select(a => a.GetProperty("fromMonth").GetString()).ShouldBe(["2026-01", "2027-03"]);
        var months = Items(ended, "months");
        months.Select(m => m.GetProperty("month").GetString()).ShouldBe(["2026-10", "2026-11", "2026-12"]);
        months[0].GetProperty("skipped").GetBoolean().ShouldBeTrue();
        months[1].GetProperty("settledOn").GetString().ShouldBe(Today().ToString("yyyy-MM-dd"));
        months[2].GetProperty("amount").GetDecimal().ShouldBe(5400m);

        var undone = await ReadJson(await DoDelete($"recurrences/{id}/months/2026/10", token));
        Items(undone, "months").Count.ShouldBe(2);
        var reopened = await ReadJson(await DoDelete($"recurrences/{id}/end", token));
        reopened.GetProperty("endMonth").ValueKind.ShouldBe(System.Text.Json.JsonValueKind.Null);

        var list = await ReadJson(await DoGet("recurrences?kind=Income", token));
        Items(list, "recurrences").Single().TryGetProperty("months", out _).ShouldBeFalse();
        Items(await ReadJson(await DoGet("recurrences?kind=Expense", token)), "recurrences").ShouldBeEmpty();
    }

    [Fact]
    public async Task Update_And_Delete()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token, "Internet");
        var id = (await ReadJson(await DoPost("recurrences", RequestRecurrenceJsonBuilder.Bill(category), token))).GetProperty("id").GetInt64();

        var updated = await ReadJson(await DoPut($"recurrences/{id}",
            new RequestUpdateRecurrenceJson { Name = "Internet fibra", CategoryId = category, DayOfMonth = 20 }, token));
        updated.GetProperty("name").GetString().ShouldBe("Internet fibra");
        updated.GetProperty("dayOfMonth").GetInt32().ShouldBe(20);

        (await DoDelete($"recurrences/{id}", token)).StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await DoGet($"recurrences/{id}", token)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await DoDelete($"categories/{category}", token)).StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Errors()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token, "Salário", CategoryType.Income);
        var id = (await ReadJson(await DoPost("recurrences", RequestRecurrenceJsonBuilder.Salary(category), token))).GetProperty("id").GetInt64();
        await DoPost($"recurrences/{id}/months/2026/11/settlement", null, token);

        var skipSettled = await DoPut($"recurrences/{id}/months/2026/11", new RequestAdjustRecurrenceMonthJson { Skipped = true }, token);
        var outOfPeriod = await DoPut($"recurrences/{id}/months/2025/11", new RequestAdjustRecurrenceMonthJson { Amount = 1 }, token);
        var endBeforeSettled = await DoPut($"recurrences/{id}/end", new RequestEndRecurrenceJson { EndMonth = "2026-10" }, token);
        var invalidKind = await DoGet("recurrences?kind=x", token);
        var wrongCategory = await DoPost("recurrences", RequestRecurrenceJsonBuilder.Bill(category), token);

        (await ReadErrors(skipSettled)).ShouldBe([ResourceMessagesException.UNDO_SETTLEMENT_BEFORE_SKIP]);
        (await ReadErrors(outOfPeriod)).ShouldBe([ResourceMessagesException.MONTH_OUT_OF_PERIOD]);
        (await ReadErrors(endBeforeSettled)).ShouldBe([ResourceMessagesException.SETTLED_AFTER_END]);
        (await ReadErrors(invalidKind)).ShouldBe([ResourceMessagesException.RECURRENCE_KIND_INVALID]);
        (await ReadErrors(wrongCategory)).ShouldBe([ResourceMessagesException.CATEGORY_NOT_EXPENSE]);
        (await DoGet("recurrences/999", token)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
