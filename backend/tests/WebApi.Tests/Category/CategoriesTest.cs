using System.Net;
using CommonTestUtilities.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.Category;

public class CategoriesTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    private const string Method = "categories";

    [Fact]
    public async Task Create_List_Rename_And_Delete()
    {
        var token = await CreateAccountAndGetToken();

        var carro = await CreateCategory(token, "  Carro ");
        await CreateCategory(token, "água");

        var renamed = await DoPut($"{Method}/{carro}", RequestCategoryJsonBuilder.Build("Carro da família"), token);
        renamed.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var list = await ReadJson(await DoGet(Method, token));
        Items(list, "categories").Select(c => c.GetProperty("name").GetString())
            .ShouldBe(["água", "Carro da família"]);
        Items(list, "categories").ShouldAllBe(c => c.GetProperty("expensesCount").GetInt32() == 0);

        var deleted = await DoDelete($"{Method}/{carro}", token);
        deleted.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        Items(await ReadJson(await DoGet(Method, token)), "categories").Count.ShouldBe(1);
    }

    [Fact]
    public async Task Error_Duplicated_Name_Ignoring_Case_And_Spaces()
    {
        var token = await CreateAccountAndGetToken();
        await CreateCategory(token, "Luz");

        var response = await DoPost(Method, RequestCategoryJsonBuilder.Build(" LUZ "), token);

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await ReadErrors(response)).ShouldBe([ResourceMessagesException.CATEGORY_NAME_ALREADY_EXISTS]);
    }

    [Fact]
    public async Task Rename_To_Same_Name_With_Other_Case_Is_Allowed_But_Not_To_Another_Category()
    {
        var token = await CreateAccountAndGetToken();
        var luz = await CreateCategory(token, "luz");
        await CreateCategory(token, "Água");

        (await DoPut($"{Method}/{luz}", RequestCategoryJsonBuilder.Build("Luz"), token)).StatusCode
            .ShouldBe(HttpStatusCode.NoContent);
        (await DoPut($"{Method}/{luz}", RequestCategoryJsonBuilder.Build("ÁGUA"), token)).StatusCode
            .ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Error_Empty_Name()
    {
        var token = await CreateAccountAndGetToken();

        var response = await DoPost(Method, RequestCategoryJsonBuilder.Build("   "), token);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await ReadErrors(response)).ShouldBe([ResourceMessagesException.CATEGORY_NAME_EMPTY]);
    }

    [Fact]
    public async Task Error_Not_Found()
    {
        var token = await CreateAccountAndGetToken();

        var update = await DoPut($"{Method}/999", RequestCategoryJsonBuilder.Build(), token);
        var delete = await DoDelete($"{Method}/999", token);

        update.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        delete.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await ReadErrors(delete)).ShouldBe([ResourceMessagesException.CATEGORY_NOT_FOUND]);
    }

    [Fact]
    public async Task Error_Delete_Category_With_Expenses()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token);
        await CreateExpense(token, RequestRegisterExpenseJsonBuilder.Build(category));

        var response = await DoDelete($"{Method}/{category}", token);

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await ReadErrors(response)).ShouldBe([ResourceMessagesException.CATEGORY_HAS_EXPENSES]);
        Items(await ReadJson(await DoGet(Method, token)), "categories").Single()
            .GetProperty("expensesCount").GetInt32().ShouldBe(1);
    }

    [Fact]
    public async Task Error_Without_Token()
    {
        var response = await DoGet(Method);

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await ReadErrors(response)).ShouldBe([ResourceMessagesException.NO_TOKEN]);
    }
}
