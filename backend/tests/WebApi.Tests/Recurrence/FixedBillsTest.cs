using CommonTestUtilities.Requests;
using Hozelo.Communication.Requests;
using Shouldly;

namespace WebApi.Tests.Recurrence;

public class FixedBillsTest(HozeloWebApplicationFactory factory) : FinanceTestBase(factory)
{
    [Fact]
    public async Task Fixed_Bill_In_Expenses_Adjusted_Paid_And_Late_Payment_Stays_In_Due_Month()
    {
        var token = await CreateAccountAndGetToken();
        var category = await CreateCategory(token, "Luz");
        var lastMonth = FirstOfMonth(-1);
        var current = FirstOfMonth(0);
        var bill = await ReadJson(await DoPost("recurrences",
            RequestRecurrenceJsonBuilder.Bill(category, 250m, $"{lastMonth:yyyy-MM}", 31), token));
        var id = bill.GetProperty("id").GetInt64();

        await DoPut($"recurrences/{id}/months/{current.Year}/{current.Month}", new RequestAdjustRecurrenceMonthJson { Amount = 287.40m }, token);
        await DoPost($"recurrences/{id}/months/{lastMonth.Year}/{lastMonth.Month}/settlement", null, token); // paga com atraso, hoje

        var last = await Summary(token, lastMonth);
        var lastBill = Items(last, "expenses").Single();
        lastBill.GetProperty("direction").GetString().ShouldBe("Expense");
        lastBill.GetProperty("isSettled").GetBoolean().ShouldBeTrue();
        lastBill.GetProperty("date").GetString().ShouldBe(new DateOnly(lastMonth.Year, lastMonth.Month, DateTime.DaysInMonth(lastMonth.Year, lastMonth.Month)).ToString("yyyy-MM-dd"));
        last.GetProperty("realized").GetProperty("paid").GetDecimal().ShouldBe(250m);

        var now = await Summary(token, current);
        var currentBill = Items(now, "expenses").Single();
        currentBill.GetProperty("amount").GetDecimal().ShouldBe(287.40m);
        currentBill.GetProperty("isSettled").GetBoolean().ShouldBeFalse();

        var future = await Summary(token, FirstOfMonth(3));
        Items(future, "expenses").Single().GetProperty("amount").GetDecimal().ShouldBe(250m);

        await DoPut($"recurrences/{id}/end", new RequestEndRecurrenceJson { EndMonth = $"{current:yyyy-MM}" }, token);
        Items(await Summary(token, FirstOfMonth(1)), "expenses").ShouldBeEmpty();
    }

    private async Task<System.Text.Json.JsonElement> Summary(string token, DateOnly month) =>
        await ReadJson(await DoGet($"summaries?year={month.Year}&month={month.Month}", token));
}
