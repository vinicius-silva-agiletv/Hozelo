using Hozelo.Domain.Repositories.User;
using Moq;

namespace CommonTestUtilities.Repositories;

public static class UserWriteOnlyRepositoryBuilder
{
    /// <summary>Devolve o mock para que o teste possa inspecionar o usuário salvo.</summary>
    public static Mock<IUserWriteOnlyRepository> Build() => new();
}
