namespace Hozelo.Domain.Repositories.OpeningBalance;

public interface IOpeningBalanceRepository
{
    /// <summary>Saldo inicial sem rastreamento, ou null se não informado.</summary>
    Task<Entities.OpeningBalance?> Get(long userId);

    /// <summary>Saldo inicial rastreado (para alterar), ou null.</summary>
    Task<Entities.OpeningBalance?> GetForUpdate(long userId);

    Task Add(Entities.OpeningBalance openingBalance);
}
