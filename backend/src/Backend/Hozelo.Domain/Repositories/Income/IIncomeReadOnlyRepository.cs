namespace Hozelo.Domain.Repositories.Income;

public interface IIncomeReadOnlyRepository
{
    /// <summary>Receita com categoria (sem rastreamento), ou null se não for do usuário.</summary>
    Task<Entities.Income?> GetById(long userId, long incomeId);

    /// <summary>Receitas do usuário com categoria; data prevista em [<paramref name="from"/>, <paramref name="to"/>) quando informada.</summary>
    Task<IList<Entities.Income>> GetAll(long userId, long? categoryId, DateOnly? from, DateOnly? to);
}
