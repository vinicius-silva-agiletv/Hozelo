using System.Net;
using System.Text.Json;
using CommonTestUtilities.Requests;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.Expense;

public class UpdateDeleteExpenseTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task Update_Recalculates_Keeping_Paid_Installments()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token, "Carro");
        var other = await CreateCategory(token, "Outra");
        var expense = await CreateExpense(token,
            RequestRegisterExpenseJsonBuilder.Installments(category, 100m, 10, new DateOnly(2025, 1, 10), alreadyPaid: 3));
        var id = expense.GetProperty("id").GetInt64();

        var request = new RequestUpdateExpenseJson
        {
            Name = "Carro novo",
            CategoryId = other,
            AmountType = AmountType.Total,
            Amount = 1200m,
            IsInstallment = true,
            InstallmentsCount = 12,
            FirstDueDate = new DateOnly(2025, 1, 10),
            Notes = "renegociado"
        };

        var response = await DoPut($"expenses/{id}", request, token);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var json = await ReadJson(response);
        json.GetProperty("name").GetString().ShouldBe("Carro novo");
        json.GetProperty("category").GetProperty("name").GetString().ShouldBe("Outra");
        json.GetProperty("amountType").GetString().ShouldBe("Total");
        json.GetProperty("installmentAmount").GetDecimal().ShouldBe(100m);
        json.GetProperty("paidInstallments").GetInt32().ShouldBe(3);
        Items(json, "installments").Count.ShouldBe(12);
        (await Factory.ExecuteScalarAsync<long>($"SELECT count(*) FROM expense_installments WHERE expense_id = {id}")).ShouldBe(12);
    }

    [Fact]
    public async Task Update_Errors()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        var expense = await CreateExpense(token,
            RequestRegisterExpenseJsonBuilder.Installments(category, 100m, 10, new DateOnly(2025, 1, 10), alreadyPaid: 3));
        var id = expense.GetProperty("id").GetInt64();

        var fewer = Request(expense, category);
        fewer.InstallmentsCount = 2;
        var fewerResponse = await DoPut($"expenses/{id}", fewer, token);
        (await ReadErrors(fewerResponse)).ShouldBe([ResourceMessagesException.PAID_INSTALLMENTS_EXCEED_COUNT]);

        await DoPost($"expenses/{id}/amortizations", new RequestAmortizeExpenseJson { Quantity = 1, PaidAmount = 90m }, token);
        var moved = Request(expense, category);
        moved.FirstDueDate = new DateOnly(2025, 2, 10);
        var movedResponse = await DoPut($"expenses/{id}", moved, token);
        movedResponse.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await ReadErrors(movedResponse)).ShouldBe([ResourceMessagesException.UNDO_PREPAYMENTS_BEFORE_RESCHEDULE]);

        var notFound = await DoPut("expenses/999", Request(expense, category), token);
        notFound.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_Removes_Installments_And_Frees_The_Category()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        var expense = await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Build(category));
        var id = expense.GetProperty("id").GetInt64();

        var deleted = await DoDelete($"expenses/{id}", token);

        deleted.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await DoGet($"expenses/{id}", token)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await Factory.ExecuteScalarAsync<long>("SELECT count(*) FROM expense_installments")).ShouldBe(0);
        (await DoDelete($"categories/{category}", token)).StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await DoDelete($"expenses/{id}", token)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    private static RequestUpdateExpenseJson Request(JsonElement expense, long categoryId) => new()
    {
        Name = expense.GetProperty("name").GetString()!,
        CategoryId = categoryId,
        AmountType = AmountType.Installment,
        Amount = expense.GetProperty("installmentAmount").GetDecimal(),
        IsInstallment = true,
        InstallmentsCount = expense.GetProperty("installmentsCount").GetInt32(),
        FirstDueDate = DateOnly.Parse(expense.GetProperty("firstDueDate").GetString()!)
    };
}
