using Hozelo.Domain.Services.Calendar;

namespace Hozelo.Infrastructure.Services.Calendar;

public sealed class Calendar(TimeProvider timeProvider, CalendarSettings settings) : ICalendar
{
    private readonly TimeZoneInfo _timeZone = TimeZoneInfo.FindSystemTimeZoneById(settings.TimeZoneId);

    public DateOnly Today()
    {
        var now = TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), _timeZone);
        return DateOnly.FromDateTime(now.DateTime);
    }
}
