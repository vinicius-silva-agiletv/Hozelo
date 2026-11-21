namespace Hozelo.Domain.Repositories.Income;

public interface IIncomeUpdateOnlyRepository
{
    /// <summary>Receita rastreada (sem a categoria), ou null se não for do usuário.</summary>
    Task<Entities.Income?> GetById(long userId, long incomeId);
}
