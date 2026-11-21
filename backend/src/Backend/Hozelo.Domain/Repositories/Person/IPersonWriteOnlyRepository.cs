namespace Hozelo.Domain.Repositories.Person;

public interface IPersonWriteOnlyRepository
{
    Task Add(Entities.Person person);

    void Delete(Entities.Person person);
}
