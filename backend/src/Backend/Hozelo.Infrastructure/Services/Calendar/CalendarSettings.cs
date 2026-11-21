namespace Hozelo.Infrastructure.Services.Calendar;

public sealed class CalendarSettings
{
    public const string Section = "Settings:Calendar";

    public string TimeZoneId { get; set; } = "America/Sao_Paulo";
}
