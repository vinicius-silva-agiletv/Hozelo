using System.Text.Json;
using CommonTestUtilities.Requests;
using Hozelo.Communication.Requests;
using Shouldly;

namespace WebApi.Tests.Summary;

public class ReimbursementsSummaryTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task Reimbursements_As_Incomes_With_Pending_And_Old_Debt_Payment()
    {
        var token = await CreateAccountAndGetToken();
        var lastMonth = FirstOfMonth(-1);
        var current = FirstOfMonth(0);
        await DoPut("opening-balance", new RequestOpeningBalanceJson { Amount = 0m, ReferenceDate = lastMonth }, token);
        var esposa = (await ReadJson(await DoPost("people", RequestPersonJsonBuilder.Build("Esposa"), token))).GetProperty("id").GetInt64();

        var old = await ReadJson(await DoPost($"people/{esposa}/charges", RequestPersonJsonBuilder.Charge(300m, lastMonth.AddDays(9)), token));
        await DoPost($"people/{esposa}/charges", RequestPersonJsonBuilder.Charge(200m, Today(), "Compras do mês"), token);

        var lastSummary = await Summary(token, lastMonth);
        Reimbursement(lastSummary).GetProperty("amount").GetDecimal().ShouldBe(300m);
        lastSummary.GetProperty("realized").GetProperty("received").GetDecimal().ShouldBe(0m);

        var before = await Summary(token, current);
        Reimbursement(before).GetProperty("amount").GetDecimal().ShouldBe(200m);
        Reimbursement(before).GetProperty("category").ValueKind.ShouldBe(JsonValueKind.Null);
        before.GetProperty("pending").GetProperty("toReceive").GetDecimal().ShouldBe(300m);
        Items(before.GetProperty("pending"), "items").Single().GetProperty("source").GetString().ShouldBe("Reimbursement");
        before.GetProperty("accumulated").GetProperty("endBalance").GetDecimal().ShouldBe(500m);

        // Paga a dívida antiga no mês atual: pendência some, realizado sobe, acumulado igual (SC-007).
        await DoPost($"people/{esposa}/payments", RequestPersonJsonBuilder.Payment(300m, Today(), old.GetProperty("key").GetString()!), token);
        var after = await Summary(token, current);
        after.GetProperty("pending").GetProperty("toReceive").GetDecimal().ShouldBe(0m);
        Items(after.GetProperty("pending"), "items").ShouldBeEmpty();
        after.GetProperty("realized").GetProperty("received").GetDecimal().ShouldBe(300m);
        Reimbursement(after).GetProperty("settledAmount").GetDecimal().ShouldBe(300m);
        after.GetProperty("accumulated").GetProperty("endBalance").GetDecimal().ShouldBe(500m);
        (await Summary(token, FirstOfMonth(1))).GetProperty("accumulated").GetProperty("previousBalance").GetDecimal().ShouldBe(500m);

        // Com filtro de categoria, sem reembolsos.
        var category = await CreateCategory(token, "Carro");
        var filtered = await ReadJson(await DoGet($"summaries?year={current.Year}&month={current.Month}&categoryId={category}", token));
        Items(filtered, "incomes").ShouldBeEmpty();
    }

    private async Task<JsonElement> Summary(string token, DateOnly month) =>
        await ReadJson(await DoGet($"summaries?year={month.Year}&month={month.Month}", token));

    private static JsonElement Reimbursement(JsonElement summary) =>
        Items(summary, "incomes").Single(i => i.GetProperty("source").GetString() == "Reimbursement");
}
