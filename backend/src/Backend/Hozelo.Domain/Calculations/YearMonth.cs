using System.Globalization;

namespace Hozelo.Domain.Calculations;

/// <summary>Mês de calendário, representado pelo primeiro dia (texto "yyyy-MM" na API).</summary>
public static class YearMonth
{
    public static DateOnly FirstDay(DateOnly date) => new(date.Year, date.Month, 1);

    public static DateOnly FirstDay(int year, int month) => new(year, month, 1);

    public static bool TryParse(string? text, out DateOnly month)
    {
        month = default;

        if (string.IsNullOrWhiteSpace(text)
            || !DateOnly.TryParseExact(text.Trim(), "yyyy-MM", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            return false;

        month = FirstDay(parsed);
        return true;
    }

    public static bool IsValid(string? text) => TryParse(text, out _);

    public static DateOnly Parse(string text) =>
        TryParse(text, out var month) ? month : throw new FormatException($"Mês inválido: {text}");

    public static string Format(DateOnly month) => month.ToString("yyyy-MM", CultureInfo.InvariantCulture);

    public static string? Format(DateOnly? month) => month.HasValue ? Format(month.Value) : null;
}
