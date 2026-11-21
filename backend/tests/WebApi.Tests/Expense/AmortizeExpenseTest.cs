using System.Net;
using CommonTestUtilities.Requests;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.Expense;

public class AmortizeExpenseTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task Amortize_Last_Installments_With_Discount_And_Monthly_View()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        var first = FirstOfMonth(1).AddDays(9); // dia 10 do próximo mês
        var expense = await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Installments(category, 1250m, 48, first));
        var id = expense.GetProperty("id").GetInt64();

        var response = await DoPost($"expenses/{id}/amortizations",
            new RequestAmortizeExpenseJson { Quantity = 6, PaidAmount = 6000m }, token);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var json = await ReadJson(response);
        json.GetProperty("remainingInstallments").GetInt32().ShouldBe(42);
        json.GetProperty("paidAmount").GetDecimal().ShouldBe(6000m);
        json.GetProperty("discountAmount").GetDecimal().ShouldBe(1500m);
        Items(json, "installments").Where(i => i.GetProperty("prepaid").GetBoolean())
            .Select(i => i.GetProperty("number").GetInt32()).ShouldBe([43, 44, 45, 46, 47, 48]);

        // Aparece no mês do pagamento...
        var current = await ReadJson(await DoGet("installments", token));
        Items(current, "installments").Count.ShouldBe(6);
        Items(current, "installments").ShouldAllBe(i => i.GetProperty("paidInAdvance").GetBoolean());
        current.GetProperty("paidAmount").GetDecimal().ShouldBe(6000m);

        // ...e não mais no mês de vencimento da última parcela.
        var lastDue = first.AddMonths(47);
        var dueMonth = await ReadJson(await DoGet($"installments?year={lastDue.Year}&month={lastDue.Month}", token));
        Items(dueMonth, "installments").ShouldBeEmpty();

        // Desfazer remove o desconto.
        await DoDelete($"expenses/{id}/installments/48/payment", token);
        var undone = await ReadJson(await DoGet($"expenses/{id}", token));
        undone.GetProperty("discountAmount").GetDecimal().ShouldBe(1250m);
        undone.GetProperty("remainingInstallments").GetInt32().ShouldBe(43);
    }

    [Fact]
    public async Task Errors()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        var expense = await CreateExpense(token,
            RequestRegisterExpenseJsonBuilder.Installments(category, 100m, 5, new DateOnly(2025, 1, 10), alreadyPaid: 2));
        var id = expense.GetProperty("id").GetInt64();

        var paidInstallment = await DoPost($"expenses/{id}/amortizations",
            new RequestAmortizeExpenseJson { InstallmentNumbers = [1], PaidAmount = 50m }, token);
        var tooMuch = await DoPost($"expenses/{id}/amortizations",
            new RequestAmortizeExpenseJson { InstallmentNumbers = [4, 5], PaidAmount = 200.01m }, token);
        var noSelection = await DoPost($"expenses/{id}/amortizations",
            new RequestAmortizeExpenseJson { PaidAmount = 50m }, token);

        (await ReadErrors(paidInstallment)).ShouldBe([ResourceMessagesException.AMORTIZATION_INSTALLMENTS_INVALID]);
        (await ReadErrors(tooMuch)).ShouldBe([ResourceMessagesException.PAID_AMOUNT_EXCEEDS_SELECTED]);
        noSelection.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await ReadErrors(noSelection)).ShouldBe([ResourceMessagesException.AMORTIZATION_SELECTION_REQUIRED]);
    }
}
