using Hozelo.Domain.Security.Tokens;
using Moq;

namespace CommonTestUtilities.Tokens;

public static class AccessTokenGeneratorBuilder
{
    public static IAccessTokenGenerator Build()
    {
        var mock = new Mock<IAccessTokenGenerator>();
        mock.Setup(g => g.Generate(It.IsAny<Guid>())).Returns((Guid id) => $"token-{id}");
        return mock.Object;
    }
}
