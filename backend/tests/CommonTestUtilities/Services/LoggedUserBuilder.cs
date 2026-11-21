using Hozelo.Domain.Entities;
using Hozelo.Domain.Services.LoggedUser;
using Moq;

namespace CommonTestUtilities.Services;

public static class LoggedUserBuilder
{
    public static ILoggedUser Build(User user)
    {
        var mock = new Mock<ILoggedUser>();
        mock.Setup(l => l.User()).ReturnsAsync(user);
        return mock.Object;
    }
}
