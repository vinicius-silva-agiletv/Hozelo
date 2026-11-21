using Hozelo.Domain.Calculations;
using Shouldly;

namespace Domain.Tests.Calculations;

public class YearMonthTest
{
    [Theory]
    [InlineData("2026-01", 2026, 1)]
    [InlineData(" 2027-12 ", 2027, 12)]
    public void Parses_Valid_Months(string text, int year, int month)
    {
        YearMonth.TryParse(text, out var parsed).ShouldBeTrue();
        parsed.ShouldBe(new DateOnly(year, month, 1));
        YearMonth.Format(parsed).ShouldBe($"{year:D4}-{month:D2}");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("2026-13")]
    [InlineData("2026/01")]
    [InlineData("2026-01-05")]
    [InlineData("jan-2026")]
    public void Rejects_Invalid_Months(string? text) => YearMonth.IsValid(text).ShouldBeFalse();
}
