namespace Hozelo.Domain.Repositories.Expense;

public interface IExpenseReadOnlyRepository
{
    /// <summary>Despesa com categoria e parcelas (sem rastreamento), ou null se não for do usuário.</summary>
    Task<Entities.Expense?> GetById(long userId, long expenseId);

    /// <summary>Despesas do usuário com categoria e parcelas, opcionalmente de uma categoria.</summary>
    Task<IList<Entities.Expense>> GetAll(long userId, long? categoryId);
}
