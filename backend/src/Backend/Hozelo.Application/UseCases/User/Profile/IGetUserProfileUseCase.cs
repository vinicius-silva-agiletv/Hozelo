using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.User.Profile;

public interface IGetUserProfileUseCase
{
    Task<ResponseUserProfileJson> Execute();
}
