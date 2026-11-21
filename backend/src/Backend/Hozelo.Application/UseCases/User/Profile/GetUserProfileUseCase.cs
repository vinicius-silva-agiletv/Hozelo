using Hozelo.Communication.Responses;
using Hozelo.Domain.Services.LoggedUser;

namespace Hozelo.Application.UseCases.User.Profile;

public sealed class GetUserProfileUseCase(ILoggedUser loggedUser) : IGetUserProfileUseCase
{
    public async Task<ResponseUserProfileJson> Execute()
    {
        var user = await loggedUser.User();

        return new ResponseUserProfileJson { Name = user.Name, Email = user.Email };
    }
}
