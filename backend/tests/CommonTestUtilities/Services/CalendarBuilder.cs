using Hozelo.Domain.Services.Calendar;
using Moq;

namespace CommonTestUtilities.Services;

public static class CalendarBuilder
{
    public static readonly DateOnly DefaultToday = new(2026, 11, 21);

    public static ICalendar Build(DateOnly? today = null)
    {
        var mock = new Mock<ICalendar>();
        mock.Setup(c => c.Today()).Returns(today ?? DefaultToday);
        return mock.Object;
    }
}
