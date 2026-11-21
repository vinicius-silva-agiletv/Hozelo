namespace Hozelo.Domain.Repositories.Expense;

public interface IExpenseWriteOnlyRepository
{
    Task Add(Entities.Expense expense);

    void Delete(Entities.Expense expense);
}
