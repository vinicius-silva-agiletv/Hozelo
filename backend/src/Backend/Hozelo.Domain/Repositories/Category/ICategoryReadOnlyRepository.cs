using Hozelo.Domain.Enums;

namespace Hozelo.Domain.Repositories.Category;

public sealed record CategoryWithEntriesCount(Entities.Category Category, int EntriesCount);

public interface ICategoryReadOnlyRepository
{
    /// <summary>Categorias do usuário em ordem alfabética (opcionalmente de um tipo), com a quantidade de lançamentos.</summary>
    Task<IList<CategoryWithEntriesCount>> GetAll(long userId, CategoryType? type = null);

    /// <summary>Categoria sem rastreamento, ou null se não for do usuário.</summary>
    Task<Entities.Category?> GetById(long userId, long categoryId);

    /// <summary>Compara dentro do tipo, ignorando maiúsculas/minúsculas; <paramref name="excludingId"/> ignora a própria categoria.</summary>
    Task<bool> ExistsWithName(long userId, CategoryType type, string name, long? excludingId = null);

    /// <summary>Despesas, receitas ou recorrências vinculadas.</summary>
    Task<bool> HasEntries(long userId, long categoryId);
}
