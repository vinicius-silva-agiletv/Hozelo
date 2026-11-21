using System.Net;
using CommonTestUtilities.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.Expense;

public class RegisterExpenseTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task Single_Payment()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token, "Água");

        var json = await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Single(category, 120.00m, new DateOnly(2026, 12, 10)));

        json.GetProperty("isInstallment").GetBoolean().ShouldBeFalse();
        json.GetProperty("installmentsCount").GetInt32().ShouldBe(1);
        json.GetProperty("lastDueDate").GetString().ShouldBe("2026-12-10");
        json.GetProperty("remainingAmount").GetDecimal().ShouldBe(120.00m);
        json.GetProperty("amountType").GetString().ShouldBe("Total");
        json.GetProperty("status").GetString().ShouldBe("Open");
        json.GetProperty("category").GetProperty("name").GetString().ShouldBe("Água");
    }

    [Fact]
    public async Task Remainder_Cents_Go_To_The_Last_Installment()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        var request = RequestRegisterExpenseJsonBuilder.Build(category);
        request.Amount = 100.00m;
        request.InstallmentsCount = 3;

        var json = await CreateExpense(token, request);

        Items(json, "installments").Select(i => i.GetProperty("amount").GetDecimal()).ShouldBe([33.33m, 33.33m, 33.34m]);
    }

    [Fact]
    public async Task Installment_Amount_With_Already_Paid()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);

        var json = await CreateExpense(token,
            RequestRegisterExpenseJsonBuilder.Installments(category, 1250.00m, 48, new DateOnly(2025, 1, 10), alreadyPaid: 22));

        json.GetProperty("totalAmount").GetDecimal().ShouldBe(60000.00m);
        json.GetProperty("paidInstallments").GetInt32().ShouldBe(22);
        json.GetProperty("remainingInstallments").GetInt32().ShouldBe(26);
        json.GetProperty("paidAmount").GetDecimal().ShouldBe(27500.00m);
        json.GetProperty("remainingAmount").GetDecimal().ShouldBe(32500.00m);
        json.GetProperty("lastDueDate").GetString().ShouldBe("2028-12-10");
        json.GetProperty("nextDueDate").GetString().ShouldBe("2026-11-10");

        var stored = await Factory.ExecuteScalarAsync<long>("SELECT count(*) FROM expense_installments WHERE paid_on IS NOT NULL");
        stored.ShouldBe(22);
    }

    [Fact]
    public async Task Day_31_Schedule()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        var request = RequestRegisterExpenseJsonBuilder.Build(category);
        request.InstallmentsCount = 3;
        request.FirstDueDate = new DateOnly(2027, 1, 31);

        var json = await CreateExpense(token, request);

        Items(json, "installments").Select(i => i.GetProperty("dueDate").GetString())
            .ShouldBe(["2027-01-31", "2027-02-28", "2027-03-31"]);
    }

    [Fact]
    public async Task Get_By_Id_Returns_Installments()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        var created = await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Build(category));

        var response = await DoGet($"expenses/{created.GetProperty("id").GetInt64()}", token);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var json = await ReadJson(response);
        Items(json, "installments").Count.ShouldBe(10);
        json.GetProperty("notes").GetString().ShouldBe("Loja X");
    }

    [Fact]
    public async Task Error_All_Validation_Messages_Including_Unknown_Category()
    {
        var token = await CreateAccountAndGetToken();
        var request = RequestRegisterExpenseJsonBuilder.Build(categoryId: 999);
        request.Name = "";
        request.Amount = -1;

        var response = await DoPost("expenses", request, token);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await ReadErrors(response)).ShouldBe(
        [
            ResourceMessagesException.EXPENSE_NAME_EMPTY,
            ResourceMessagesException.AMOUNT_MUST_BE_POSITIVE,
            ResourceMessagesException.EXPENSE_CATEGORY_NOT_EXISTS
        ], ignoreOrder: true);
    }

    [Fact]
    public async Task Error_Income_Category()
    {
        var token = await CreateAccountAndGetToken();
        var response = await DoPost("categories", RequestCategoryJsonBuilder.Build("Salário", Hozelo.Communication.Enums.CategoryType.Income), token);
        var category = (await ReadJson(response)).GetProperty("id").GetInt64();

        var expense = await DoPost("expenses", RequestRegisterExpenseJsonBuilder.Build(category), token);

        expense.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await ReadErrors(expense)).ShouldBe([ResourceMessagesException.CATEGORY_NOT_EXPENSE]);
    }

    [Fact]
    public async Task Error_Not_Found_And_Without_Token()
    {
        var token = await CreateAccountAndGetToken();

        (await DoGet("expenses/999", token)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await DoGet("expenses/999")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }
}
