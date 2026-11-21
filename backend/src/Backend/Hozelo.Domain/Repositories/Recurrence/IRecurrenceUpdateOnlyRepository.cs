namespace Hozelo.Domain.Repositories.Recurrence;

public interface IRecurrenceUpdateOnlyRepository
{
    /// <summary>Recorrência rastreada com valores e meses (sem a categoria), ou null se não for do usuário.</summary>
    Task<Entities.RecurringEntry?> GetById(long userId, long recurrenceId);
}
