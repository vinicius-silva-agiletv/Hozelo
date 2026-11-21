using System.Net;
using System.Text.Json;
using CommonTestUtilities.Requests;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.Person;

public class PersonStatementTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task Marked_Expense_Payments_Carry_Over_And_Summary()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token, "Cartão");
        var sogro = await CreatePerson(token, "Sogro");
        var lastMonth = FirstOfMonth(-1);
        var current = FirstOfMonth(0);

        var request = RequestRegisterExpenseJsonBuilder.Build(category);
        request.Name = "Peças do carro";
        request.Amount = 1500m;
        request.FirstDueDate = lastMonth.AddDays(4);
        request.PersonId = sogro;
        var expense = await CreateExpense(token, request);
        expense.GetProperty("person").GetProperty("name").GetString().ShouldBe("Sogro");
        expense.GetProperty("personPercent").GetInt32().ShouldBe(100);
        var currentKey = $"Installment:{0}";

        var last = await Statement(token, sogro, lastMonth);
        Items(last, "charges").Single().GetProperty("amount").GetDecimal().ShouldBe(150m);
        last.GetProperty("endBalance").GetDecimal().ShouldBe(150m);

        // Paga 100 hoje (abate a cobrança mais antiga).
        (await DoPost($"people/{sogro}/payments", RequestPersonJsonBuilder.Payment(100m, Today()), token)).StatusCode.ShouldBe(HttpStatusCode.Created);
        var now = await Statement(token, sogro, current);
        now.GetProperty("previousBalance").GetDecimal().ShouldBe(150m);
        now.GetProperty("totalDue").GetDecimal().ShouldBe(300m);
        now.GetProperty("endBalance").GetDecimal().ShouldBe(200m);
        currentKey = Items(now, "charges").Single().GetProperty("key").GetString()!;
        Items(await Statement(token, sogro, lastMonth), "charges").Single().GetProperty("status").GetString().ShouldBe("Partial");

        // Paga 150 escolhendo a parcela do mês atual.
        (await DoPost($"people/{sogro}/payments", RequestPersonJsonBuilder.Payment(150m, Today(), currentKey), token)).StatusCode.ShouldBe(HttpStatusCode.Created);
        now = await Statement(token, sogro, current);
        Items(now, "charges").Single().GetProperty("status").GetString().ShouldBe("Paid");
        now.GetProperty("endBalance").GetDecimal().ShouldBe(50m);
        Items(await Statement(token, sogro, lastMonth), "charges").Single().GetProperty("remaining").GetDecimal().ShouldBe(50m);
        (await Statement(token, sogro, FirstOfMonth(1))).GetProperty("previousBalance").GetDecimal().ShouldBe(50m);

        // Escolher uma cobrança já paga é recusado.
        var invalid = await DoPost($"people/{sogro}/payments", RequestPersonJsonBuilder.Payment(10m, Today(), currentKey), token);
        (await ReadErrors(invalid)).ShouldBe([ResourceMessagesException.PAYMENT_TARGETS_INVALID]);

        var summary = await ReadJson(await DoGet($"people/{sogro}/summary", token));
        var origin = Items(summary, "origins").Single();
        origin.GetProperty("chargesDue").GetInt32().ShouldBe(2);
        origin.GetProperty("chargesTotal").GetInt32().ShouldBe(10);
        origin.GetProperty("paid").GetDecimal().ShouldBe(250m);
        origin.GetProperty("remaining").GetDecimal().ShouldBe(1250m);
        summary.GetProperty("owedUntilNow").GetDecimal().ShouldBe(50m);
        summary.GetProperty("owedTotal").GetDecimal().ShouldBe(1250m);

        var people = await ReadJson(await DoGet("people", token));
        var row = Items(people, "people").Single();
        row.GetProperty("balanceUntilNow").GetDecimal().ShouldBe(50m);
        row.GetProperty("currentMonthDue").GetDecimal().ShouldBe(50m);

        // Pessoa com lançamentos não pode ser removida; desmarcar a despesa tira as cobranças.
        (await DoDelete($"people/{sogro}", token)).StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var update = new RequestUpdateExpenseJson
        {
            Name = "Peças do carro", CategoryId = category, AmountType = Hozelo.Communication.Enums.AmountType.Total, Amount = 1500m,
            IsInstallment = true, InstallmentsCount = 10, FirstDueDate = lastMonth.AddDays(4)
        };
        (await DoPut($"expenses/{expense.GetProperty("id").GetInt64()}", update, token)).StatusCode.ShouldBe(HttpStatusCode.OK);
        Items(await Statement(token, sogro, current), "charges").ShouldBeEmpty();
    }

    [Fact]
    public async Task Percent_Fixed_Bill_Manual_Charge_And_Credit()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token, "Cartão");
        var esposa = await CreatePerson(token, "Esposa");
        var cunhado = await CreatePerson(token, "Cunhado");
        var primo = await CreatePerson(token, "Primo");
        var current = FirstOfMonth(0);
        var lastMonth = FirstOfMonth(-1);

        var dinner = RequestRegisterExpenseJsonBuilder.Single(category, 400m, current.AddDays(1));
        dinner.PersonId = esposa;
        dinner.PersonPercent = 50;
        await CreateExpense(token, dinner);
        await DoPost($"people/{esposa}/charges", RequestPersonJsonBuilder.Charge(300m, Today()), token);
        var esposaNow = await Statement(token, esposa, current);
        Items(esposaNow, "charges").Select(c => c.GetProperty("amount").GetDecimal()).Order().ShouldBe([200m, 300m]);

        var bill = RequestRecurrenceJsonBuilder.Bill(category, 80m, $"{lastMonth:yyyy-MM}", 10);
        bill.Name = "Celular";
        bill.PersonId = cunhado;
        var billJson = await ReadJson(await DoPost("recurrences", bill, token));
        billJson.GetProperty("person").GetProperty("name").GetString().ShouldBe("Cunhado");
        await DoPut($"recurrences/{billJson.GetProperty("id").GetInt64()}/months/{current.Year}/{current.Month}",
            new RequestAdjustRecurrenceMonthJson { Amount = 95m }, token);
        Items(await Statement(token, cunhado, current), "charges").Single().GetProperty("amount").GetDecimal().ShouldBe(95m);
        var cunhadoSummary = await ReadJson(await DoGet($"people/{cunhado}/summary", token));
        var fixedOrigin = Items(cunhadoSummary, "origins").Single();
        fixedOrigin.GetProperty("isOpenEnded").GetBoolean().ShouldBeTrue();
        fixedOrigin.GetProperty("chargesTotal").GetInt32().ShouldBe(2);
        fixedOrigin.GetProperty("monthlyAmount").GetDecimal().ShouldBe(95m);
        fixedOrigin.GetProperty("total").GetDecimal().ShouldBe(175m);

        await DoPost($"people/{primo}/charges", RequestPersonJsonBuilder.Charge(100m, Today()), token);
        await DoPost($"people/{primo}/payments", RequestPersonJsonBuilder.Payment(150m, Today()), token);
        (await Statement(token, primo, current)).GetProperty("endBalance").GetDecimal().ShouldBe(-50m);
        (await ReadJson(await DoGet($"people/{primo}/summary", token))).GetProperty("unallocatedCredit").GetDecimal().ShouldBe(50m);

        var salaryCategory = await CreateCategory(token, "Salário", Hozelo.Communication.Enums.CategoryType.Income);
        var salary = RequestRecurrenceJsonBuilder.Salary(salaryCategory);
        salary.PersonId = esposa;
        (await ReadErrors(await DoPost("recurrences", salary, token))).ShouldBe([ResourceMessagesException.RECURRENCE_INCOME_CANNOT_BE_MARKED]);
    }

    private async Task<long> CreatePerson(string token, string name) =>
        (await ReadJson(await DoPost("people", RequestPersonJsonBuilder.Build(name), token))).GetProperty("id").GetInt64();

    private async Task<JsonElement> Statement(string token, long person, DateOnly month) =>
        await ReadJson(await DoGet($"people/{person}/statement?year={month.Year}&month={month.Month}", token));
}
