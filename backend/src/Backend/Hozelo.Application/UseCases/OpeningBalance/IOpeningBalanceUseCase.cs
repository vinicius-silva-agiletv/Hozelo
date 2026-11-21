using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.OpeningBalance;

public interface IOpeningBalanceUseCase
{
    Task<ResponseOpeningBalanceJson> Get();

    Task<ResponseOpeningBalanceJson> Set(RequestOpeningBalanceJson request);
}
