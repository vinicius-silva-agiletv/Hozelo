namespace Hozelo.Domain.Repositories.Category;

public interface ICategoryWriteOnlyRepository
{
    Task Add(Entities.Category category);

    void Delete(Entities.Category category);
}
