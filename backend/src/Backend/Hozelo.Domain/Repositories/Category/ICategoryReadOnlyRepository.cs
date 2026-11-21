namespace Hozelo.Domain.Repositories.Category;

public sealed record CategoryWithExpensesCount(Entities.Category Category, int ExpensesCount);

public interface ICategoryReadOnlyRepository
{
    /// <summary>Categorias do usuário em ordem alfabética, com a quantidade de despesas.</summary>
    Task<IList<CategoryWithExpensesCount>> GetAll(long userId);

    /// <summary>Categoria sem rastreamento, ou null se não for do usuário.</summary>
    Task<Entities.Category?> GetById(long userId, long categoryId);

    /// <summary>Compara ignorando maiúsculas/minúsculas; <paramref name="excludingId"/> ignora a própria categoria.</summary>
    Task<bool> ExistsWithName(long userId, string name, long? excludingId = null);

    Task<bool> HasExpenses(long userId, long categoryId);
}
