namespace Hozelo.Domain.Repositories.User;

public interface IUserReadOnlyRepository
{
    Task<bool> ExistsAnyUser();

    Task<Entities.User?> GetActiveByEmail(string email);

    Task<Entities.User?> GetActiveByUserIdentifier(Guid userIdentifier);
}
