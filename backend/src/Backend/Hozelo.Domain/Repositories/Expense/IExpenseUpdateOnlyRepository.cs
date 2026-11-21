namespace Hozelo.Domain.Repositories.Expense;

public interface IExpenseUpdateOnlyRepository
{
    /// <summary>Despesa rastreada com as parcelas (sem a categoria), ou null se não for do usuário.</summary>
    Task<Entities.Expense?> GetById(long userId, long expenseId);
}
