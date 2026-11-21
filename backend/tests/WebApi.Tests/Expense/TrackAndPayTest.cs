using System.Net;
using CommonTestUtilities.Requests;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.Expense;

public class TrackAndPayTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task List_With_Filters_Order_And_Totals()
    {
        var token = await CreateAccountAndGetToken();
        var carro = await CreateCategory(token, "Carro");
        var agua = await CreateCategory(token, "Água");
        await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Installments(carro, 1000m, 3, new DateOnly(2027, 5, 10)));
        await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Single(agua, 120m, new DateOnly(2027, 1, 10)));
        var paid = RequestRegisterExpenseJsonBuilder.Installments(carro, 50m, 2, new DateOnly(2024, 1, 10), alreadyPaid: 2);
        paid.Name = "Quitada";
        await CreateExpense(token, paid);

        var all = await ReadJson(await DoGet("expenses", token));
        Items(all, "expenses").Select(e => e.GetProperty("name").GetString())
            .ShouldBe(["Conta de água", "Financiamento do carro", "Quitada"]);
        all.GetProperty("totalRemainingAmount").GetDecimal().ShouldBe(3120m);
        all.GetProperty("totalPaidAmount").GetDecimal().ShouldBe(100m);
        Items(all, "expenses")[0].TryGetProperty("installments", out _).ShouldBeFalse();

        var open = await ReadJson(await DoGet($"expenses?status=Open&categoryId={carro}", token));
        Items(open, "expenses").Select(e => e.GetProperty("name").GetString()).ShouldBe(["Financiamento do carro"]);
        open.GetProperty("totalRemainingAmount").GetDecimal().ShouldBe(3000m);
        open.GetProperty("totalPaidAmount").GetDecimal().ShouldBe(0m);

        var invalid = await DoGet("expenses?status=late", token);
        invalid.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await ReadErrors(invalid)).ShouldBe([ResourceMessagesException.EXPENSE_STATUS_INVALID]);
    }

    [Fact]
    public async Task Pay_And_Undo_Installment()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        var expense = await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Installments(category, 100m, 3, new DateOnly(2027, 1, 10)));
        var id = expense.GetProperty("id").GetInt64();

        var paid = await DoPost($"expenses/{id}/installments/3/payment", null, token);
        paid.StatusCode.ShouldBe(HttpStatusCode.OK);
        var paidJson = await ReadJson(paid);
        paidJson.GetProperty("paidInstallments").GetInt32().ShouldBe(1);
        Items(paidJson, "installments")[2].GetProperty("paidOn").GetString().ShouldBe(Today().ToString("yyyy-MM-dd"));

        var again = await ReadJson(await DoPost($"expenses/{id}/installments/3/payment", null, token));
        again.GetProperty("paidAmount").GetDecimal().ShouldBe(100m);

        var undone = await ReadJson(await DoDelete($"expenses/{id}/installments/3/payment", token));
        undone.GetProperty("paidInstallments").GetInt32().ShouldBe(0);
        undone.GetProperty("remainingAmount").GetDecimal().ShouldBe(300m);
    }

    [Fact]
    public async Task Pay_All_Settles_The_Expense()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        var expense = await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Single(category, 80m, Today()));
        var id = expense.GetProperty("id").GetInt64();

        var json = await ReadJson(await DoPost($"expenses/{id}/installments/1/payment",
            new RequestPayInstallmentJson { PaidOn = Today().AddDays(-1) }, token));

        json.GetProperty("status").GetString().ShouldBe("Paid");
        json.GetProperty("nextDueDate").ValueKind.ShouldBe(System.Text.Json.JsonValueKind.Null);
    }

    [Fact]
    public async Task Pay_Errors()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        var expense = await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Single(category, 80m, Today()));
        var id = expense.GetProperty("id").GetInt64();

        var future = await DoPost($"expenses/{id}/installments/1/payment",
            new RequestPayInstallmentJson { PaidOn = Today().AddDays(1) }, token);
        var unknownInstallment = await DoPost($"expenses/{id}/installments/2/payment", null, token);
        var unknownExpense = await DoPost("expenses/999/installments/1/payment", null, token);

        future.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await ReadErrors(future)).ShouldBe([ResourceMessagesException.PAID_ON_IN_FUTURE]);
        unknownInstallment.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await ReadErrors(unknownInstallment)).ShouldBe([ResourceMessagesException.INSTALLMENT_NOT_FOUND]);
        unknownExpense.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
