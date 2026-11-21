namespace Hozelo.Domain.Repositories.Person;

public interface IPersonUpdateOnlyRepository
{
    Task<Entities.Person?> GetById(long userId, long personId);
}
