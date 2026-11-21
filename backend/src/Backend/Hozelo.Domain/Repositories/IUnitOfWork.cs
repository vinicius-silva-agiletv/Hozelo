namespace Hozelo.Domain.Repositories;

public interface IUnitOfWork
{
    Task Commit();
}
