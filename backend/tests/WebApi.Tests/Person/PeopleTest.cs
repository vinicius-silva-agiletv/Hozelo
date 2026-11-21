using System.Net;
using CommonTestUtilities.Requests;
using Hozelo.Exception;
using Shouldly;

namespace WebApi.Tests.Person;

public class PeopleTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task Crud()
    {
        var token = await CreateAccountAndGetToken();

        var created = await DoPost("people", RequestPersonJsonBuilder.Build("Sogro"), token);
        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        var id = (await ReadJson(created)).GetProperty("id").GetInt64();
        await DoPost("people", RequestPersonJsonBuilder.Build("Esposa"), token);

        var duplicated = await DoPost("people", RequestPersonJsonBuilder.Build(" sogro "), token);
        duplicated.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await ReadErrors(duplicated)).ShouldBe([ResourceMessagesException.PERSON_NAME_ALREADY_EXISTS]);

        (await DoPut($"people/{id}", RequestPersonJsonBuilder.Build("Sogro João"), token)).StatusCode.ShouldBe(HttpStatusCode.NoContent);
        var list = await ReadJson(await DoGet("people", token));
        Items(list, "people").Select(p => p.GetProperty("name").GetString()).ShouldBe(["Esposa", "Sogro João"]);
        Items(list, "people").ShouldAllBe(p => p.GetProperty("balanceUntilNow").GetDecimal() == 0m);

        (await DoDelete($"people/{id}", token)).StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await DoDelete($"people/{id}", token)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await DoGet("people")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }
}
