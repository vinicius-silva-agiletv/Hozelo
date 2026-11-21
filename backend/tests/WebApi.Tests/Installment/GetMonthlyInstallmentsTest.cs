using System.Net;
using CommonTestUtilities.Requests;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.Installment;

public class GetMonthlyInstallmentsTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task Current_Future_And_Past_Months()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        var first = FirstOfMonth(-2).AddDays(4); // dia 5, dois meses atrás
        await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Installments(category, 100m, 4, first));

        var current = await ReadJson(await DoGet("installments", token));
        current.GetProperty("year").GetInt32().ShouldBe(Today().Year);
        current.GetProperty("month").GetInt32().ShouldBe(Today().Month);
        Items(current, "installments").Select(i => i.GetProperty("number").GetInt32()).ShouldBe([3]);
        current.GetProperty("openAmount").GetDecimal().ShouldBe(100m);

        var next = FirstOfMonth(1);
        var future = await ReadJson(await DoGet($"installments?year={next.Year}&month={next.Month}", token));
        Items(future, "installments").Single().GetProperty("number").GetInt32().ShouldBe(4);
        Items(future, "installments").Single().GetProperty("installmentsCount").GetInt32().ShouldBe(4);

        var after = FirstOfMonth(2);
        var empty = await ReadJson(await DoGet($"installments?year={after.Year}&month={after.Month}", token));
        Items(empty, "installments").ShouldBeEmpty();
        empty.GetProperty("totalAmount").GetDecimal().ShouldBe(0m);
    }

    [Fact]
    public async Task Late_Payment_Stays_In_The_Due_Month()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        var first = FirstOfMonth(-2).AddDays(4);
        var expense = await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Installments(category, 100m, 3, first));
        var id = expense.GetProperty("id").GetInt64();

        await DoPost($"expenses/{id}/installments/1/payment", null, token); // paga hoje, com atraso

        var dueMonth = await ReadJson(await DoGet($"installments?year={first.Year}&month={first.Month}", token));
        var installment = Items(dueMonth, "installments").Single();
        installment.GetProperty("isPaid").GetBoolean().ShouldBeTrue();
        installment.GetProperty("paidInAdvance").GetBoolean().ShouldBeFalse();
        dueMonth.GetProperty("paidAmount").GetDecimal().ShouldBe(100m);

        var current = await ReadJson(await DoGet("installments", token));
        Items(current, "installments").Select(i => i.GetProperty("number").GetInt32()).ShouldBe([3]);
    }

    [Fact]
    public async Task Filter_By_Category_And_Pay_From_The_View()
    {
        var token = await CreateAccountAndGetToken();
        var carro = await CreateCategory(token, "Carro");
        var agua = await CreateCategory(token, "Água");
        var day = FirstOfMonth(0);
        await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Installments(carro, 1000m, 2, day));
        await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Single(agua, 120m, day));

        var filtered = await ReadJson(await DoGet($"installments?categoryId={agua}", token));
        var item = Items(filtered, "installments").Single();
        item.GetProperty("category").GetProperty("name").GetString().ShouldBe("Água");

        await DoPost($"expenses/{item.GetProperty("expenseId").GetInt64()}/installments/{item.GetProperty("number").GetInt32()}/payment",
            new RequestPayInstallmentJson(), token);

        var all = await ReadJson(await DoGet("installments", token));
        all.GetProperty("totalAmount").GetDecimal().ShouldBe(1120m);
        all.GetProperty("paidAmount").GetDecimal().ShouldBe(120m);
        all.GetProperty("openAmount").GetDecimal().ShouldBe(1000m);
    }

    [Fact]
    public async Task Error_Invalid_Month()
    {
        var token = await CreateAccountAndGetToken();

        var response = await DoGet("installments?year=2026&month=13", token);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await ReadErrors(response)).ShouldBe([ResourceMessagesException.MONTH_INVALID]);
    }
}
