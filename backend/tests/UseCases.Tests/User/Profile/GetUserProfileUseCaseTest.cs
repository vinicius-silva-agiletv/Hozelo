using CommonTestUtilities.Entities;
using CommonTestUtilities.Services;
using Hozelo.Application.UseCases.User.Profile;
using Shouldly;

namespace UseCases.Tests.User.Profile;

public class GetUserProfileUseCaseTest
{
    [Fact]
    public async Task Success()
    {
        var (user, _) = UserBuilder.Build();
        var useCase = new GetUserProfileUseCase(LoggedUserBuilder.Build(user));

        var result = await useCase.Execute();

        result.Name.ShouldBe(user.Name);
        result.Email.ShouldBe(user.Email);
    }
}
