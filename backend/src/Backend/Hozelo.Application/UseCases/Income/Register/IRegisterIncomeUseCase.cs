using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Income.Register;

public interface IRegisterIncomeUseCase
{
    Task<ResponseIncomeJson> Execute(RequestIncomeJson request);
}
