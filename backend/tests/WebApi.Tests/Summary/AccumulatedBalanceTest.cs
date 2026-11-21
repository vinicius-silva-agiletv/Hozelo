using CommonTestUtilities.Requests;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;
using Shouldly;

namespace WebApi.Tests.Summary;

public class AccumulatedBalanceTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task Accumulated_With_Pending_From_Last_Month()
    {
        var token = await CreateAccountAndGetToken();
        var lastMonth = FirstOfMonth(-1);
        var current = FirstOfMonth(0);
        var next = FirstOfMonth(1);
        var salaryCategory = await CreateCategory(token, "Salário", CategoryType.Income);
        var otherIncome = await CreateCategory(token, "Extra", CategoryType.Income);
        var internetCategory = await CreateCategory(token, "Internet");
        var carCategory = await CreateCategory(token, "Carro");

        var opening = await DoPut("opening-balance", new RequestOpeningBalanceJson { Amount = 1000m, ReferenceDate = lastMonth }, token);
        (await ReadJson(opening)).GetProperty("amount").GetDecimal().ShouldBe(1000m);

        var salary = await ReadJson(await DoPost("recurrences",
            RequestRecurrenceJsonBuilder.Salary(salaryCategory, 5000m, $"{lastMonth:yyyy-MM}"), token));
        var internet = await ReadJson(await DoPost("recurrences",
            RequestRecurrenceJsonBuilder.Bill(internetCategory, 100m, $"{lastMonth:yyyy-MM}"), token));
        await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Single(carCategory, 300m, current.AddDays(9)));
        await DoPost("incomes", RequestIncomeJsonBuilder.Build(otherIncome, 200m, current.AddDays(19)), token);
        var salaryId = salary.GetProperty("id").GetInt64();
        var internetId = internet.GetProperty("id").GetInt64();

        // Mês passado: salário recebido, internet não paga (vira pendência).
        await DoPost($"recurrences/{salaryId}/months/{lastMonth.Year}/{lastMonth.Month}/settlement", null, token);

        var last = await Summary(token, lastMonth);
        last.GetProperty("accumulated").GetProperty("previousBalance").GetDecimal().ShouldBe(1000m);
        last.GetProperty("accumulated").GetProperty("endBalance").GetDecimal().ShouldBe(6000m);

        var now = await Summary(token, current);
        now.GetProperty("forecast").GetProperty("balance").GetDecimal().ShouldBe(4800m);
        now.GetProperty("pending").GetProperty("toPay").GetDecimal().ShouldBe(100m);
        now.GetProperty("pending").GetProperty("toReceive").GetDecimal().ShouldBe(0m);
        Items(now.GetProperty("pending"), "items").Single().GetProperty("month").GetString().ShouldBe($"{lastMonth:yyyy-MM}");
        now.GetProperty("accumulated").GetProperty("previousBalance").GetDecimal().ShouldBe(6000m);
        now.GetProperty("accumulated").GetProperty("endBalance").GetDecimal().ShouldBe(10700m);

        var future = await Summary(token, next);
        future.GetProperty("pending").ValueKind.ShouldBe(System.Text.Json.JsonValueKind.Null);
        future.GetProperty("accumulated").GetProperty("previousBalance").GetDecimal().ShouldBe(10700m);
        future.GetProperty("accumulated").GetProperty("endBalance").GetDecimal().ShouldBe(15600m);

        // Pagar a internet do mês passado: sai das pendências e o acumulado do mês atual não muda.
        await DoPost($"recurrences/{internetId}/months/{lastMonth.Year}/{lastMonth.Month}/settlement", null, token);
        var afterPaying = await Summary(token, current);
        Items(afterPaying.GetProperty("pending"), "items").ShouldBeEmpty();
        afterPaying.GetProperty("accumulated").GetProperty("previousBalance").GetDecimal().ShouldBe(5900m);
        afterPaying.GetProperty("accumulated").GetProperty("endBalance").GetDecimal().ShouldBe(10700m);
        var lastAfter = await Summary(token, lastMonth);
        Items(lastAfter, "expenses").Single().GetProperty("isSettled").GetBoolean().ShouldBeTrue();

        // Antes do saldo inicial e com filtro de categoria não há acumulado.
        var before = await Summary(token, FirstOfMonth(-2));
        before.GetProperty("accumulated").ValueKind.ShouldBe(System.Text.Json.JsonValueKind.Null);
        before.GetProperty("openingBalanceMissing").GetBoolean().ShouldBeFalse();
        var filtered = await ReadJson(await DoGet($"summaries?year={current.Year}&month={current.Month}&categoryId={carCategory}", token));
        filtered.GetProperty("accumulated").ValueKind.ShouldBe(System.Text.Json.JsonValueKind.Null);
        filtered.GetProperty("pending").ValueKind.ShouldBe(System.Text.Json.JsonValueKind.Null);
    }

    private async Task<System.Text.Json.JsonElement> Summary(string token, DateOnly month) =>
        await ReadJson(await DoGet($"summaries?year={month.Year}&month={month.Month}", token));
}
