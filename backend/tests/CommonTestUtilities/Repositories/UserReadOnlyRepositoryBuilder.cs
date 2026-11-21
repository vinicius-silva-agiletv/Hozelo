using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.User;
using Moq;

namespace CommonTestUtilities.Repositories;

public class UserReadOnlyRepositoryBuilder
{
    private readonly Mock<IUserReadOnlyRepository> _repository = new();

    public UserReadOnlyRepositoryBuilder ExistsAnyUser()
    {
        _repository.Setup(r => r.ExistsAnyUser()).ReturnsAsync(true);
        return this;
    }

    public UserReadOnlyRepositoryBuilder GetActiveByEmail(User user)
    {
        _repository.Setup(r => r.GetActiveByEmail(user.Email)).ReturnsAsync(user);
        return this;
    }

    public UserReadOnlyRepositoryBuilder GetActiveByUserIdentifier(User user)
    {
        _repository.Setup(r => r.GetActiveByUserIdentifier(user.UserIdentifier)).ReturnsAsync(user);
        return this;
    }

    public IUserReadOnlyRepository Build() => _repository.Object;
}
