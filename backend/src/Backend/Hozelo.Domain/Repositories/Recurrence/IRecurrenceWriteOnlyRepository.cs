namespace Hozelo.Domain.Repositories.Recurrence;

public interface IRecurrenceWriteOnlyRepository
{
    Task Add(Entities.RecurringEntry entry);

    void Delete(Entities.RecurringEntry entry);
}
