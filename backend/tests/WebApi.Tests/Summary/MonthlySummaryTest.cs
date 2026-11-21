using System.Net;
using CommonTestUtilities.Requests;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.Summary;

public class MonthlySummaryTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task Incomes_Expenses_And_Balance_Of_Any_Month()
    {
        var token = await CreateAccountAndGetToken();
        var salaryCategory = await CreateCategory(token, "Salário", CategoryType.Income);
        var bonusCategory = await CreateCategory(token, "13º", CategoryType.Income);
        var carCategory = await CreateCategory(token, "Carro");
        var salary = await ReadJson(await DoPost("recurrences", RequestRecurrenceJsonBuilder.Salary(salaryCategory, startMonth: "2030-01"), token));
        await DoPost("incomes", RequestIncomeJsonBuilder.Build(bonusCategory, 2500m, new DateOnly(2030, 11, 30)), token);
        await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Single(carCategory, 6120m, new DateOnly(2030, 11, 10)));
        await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Single(carCategory, 7000m, new DateOnly(2030, 12, 10)));

        var november = await ReadJson(await DoGet("summaries?year=2030&month=11", token));
        november.GetProperty("forecast").GetProperty("incomes").GetDecimal().ShouldBe(8500m);
        november.GetProperty("forecast").GetProperty("expenses").GetDecimal().ShouldBe(6120m);
        november.GetProperty("forecast").GetProperty("balance").GetDecimal().ShouldBe(2380m);
        Items(november, "incomes").Select(i => i.GetProperty("source").GetString()).ShouldBe(["Recurrence", "Income"]);
        Items(november, "expenses").Single().GetProperty("source").GetString().ShouldBe("Installment");
        november.GetProperty("openingBalanceMissing").GetBoolean().ShouldBeTrue();
        november.GetProperty("accumulated").ValueKind.ShouldBe(System.Text.Json.JsonValueKind.Null);

        var december = await ReadJson(await DoGet("summaries?year=2030&month=12", token));
        december.GetProperty("forecast").GetProperty("balance").GetDecimal().ShouldBe(-1000m);

        var empty = await ReadJson(await DoGet("summaries?year=2029&month=6", token));
        empty.GetProperty("forecast").GetProperty("balance").GetDecimal().ShouldBe(0m);
        Items(empty, "incomes").ShouldBeEmpty();

        var filtered = await ReadJson(await DoGet($"summaries?year=2030&month=11&categoryId={carCategory}", token));
        Items(filtered, "incomes").ShouldBeEmpty();
        filtered.GetProperty("forecast").GetProperty("expenses").GetDecimal().ShouldBe(6120m);
        filtered.GetProperty("openingBalanceMissing").GetBoolean().ShouldBeFalse();

        // Confirmar o salário de novembro entra no realizado só daquele mês.
        await DoPost($"recurrences/{salary.GetProperty("id").GetInt64()}/months/2030/11/settlement", null, token);
        var settled = await ReadJson(await DoGet("summaries?year=2030&month=11", token));
        settled.GetProperty("realized").GetProperty("received").GetDecimal().ShouldBe(6000m);
        Items(settled, "incomes")[0].GetProperty("isSettled").GetBoolean().ShouldBeTrue();
        var stillOpen = await ReadJson(await DoGet("summaries?year=2030&month=12", token));
        stillOpen.GetProperty("realized").GetProperty("received").GetDecimal().ShouldBe(0m);

        // A visão de parcelas da feature 002 não muda.
        var installments = await ReadJson(await DoGet("installments?year=2030&month=11", token));
        installments.GetProperty("totalAmount").GetDecimal().ShouldBe(6120m);
    }

    [Fact]
    public async Task Errors()
    {
        var token = await CreateAccountAndGetToken();

        (await ReadErrors(await DoGet("summaries?year=2030", token))).ShouldBe([ResourceMessagesException.MONTH_INVALID]);
        (await DoGet("summaries")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await DoGet("opening-balance", token)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        var invalid = await DoPut("opening-balance", new RequestOpeningBalanceJson { Amount = 10 }, token);
        (await ReadErrors(invalid)).ShouldBe([ResourceMessagesException.OPENING_DATE_EMPTY]);
    }
}
