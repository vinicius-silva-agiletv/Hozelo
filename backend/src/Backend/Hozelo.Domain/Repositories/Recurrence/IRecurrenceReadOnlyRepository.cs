using Hozelo.Domain.Enums;

namespace Hozelo.Domain.Repositories.Recurrence;

public interface IRecurrenceReadOnlyRepository
{
    /// <summary>Recorrência com categoria, valores e meses (sem rastreamento), ou null se não for do usuário.</summary>
    Task<Entities.RecurringEntry?> GetById(long userId, long recurrenceId);

    /// <summary>Recorrências do usuário com categoria, valores e meses.</summary>
    Task<IList<Entities.RecurringEntry>> GetAll(long userId, EntryKind? kind, long? categoryId);
}
