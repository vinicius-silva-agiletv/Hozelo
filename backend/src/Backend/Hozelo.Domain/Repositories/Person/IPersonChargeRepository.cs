using Hozelo.Domain.Entities;

namespace Hozelo.Domain.Repositories.Person;

public interface IPersonChargeRepository
{
    /// <summary>Cobranças avulsas (sem rastreamento) de uma pessoa, ou de todas quando <paramref name="personId"/> é null.</summary>
    Task<IList<PersonCharge>> GetAll(long userId, long? personId);

    /// <summary>Cobrança avulsa rastreada.</summary>
    Task<PersonCharge?> GetForUpdate(long userId, long personId, long chargeId);

    Task Add(PersonCharge charge);

    void Delete(PersonCharge charge);
}
