namespace Hozelo.Domain.Services.Calendar;

/// <summary>Data de calendário atual no fuso da família (research.md §2).</summary>
public interface ICalendar
{
    DateOnly Today();
}
