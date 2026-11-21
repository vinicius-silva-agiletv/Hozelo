namespace Hozelo.Domain.Repositories.Person;

public interface IPersonReadOnlyRepository
{
    Task<IList<Entities.Person>> GetAll(long userId);

    Task<Entities.Person?> GetById(long userId, long personId);

    Task<bool> ExistsWithName(long userId, string name, long? excludingId = null);

    /// <summary>Cobranças avulsas, pagamentos, despesas ou contas fixas marcadas.</summary>
    Task<bool> HasEntries(long userId, long personId);
}
