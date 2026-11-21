namespace Hozelo.Domain.Repositories.Category;

public interface ICategoryUpdateOnlyRepository
{
    /// <summary>Categoria rastreada (alterações gravadas no Commit), ou null se não for do usuário.</summary>
    Task<Entities.Category?> GetById(long userId, long categoryId);
}
