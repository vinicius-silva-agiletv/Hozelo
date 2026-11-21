using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Income.Update;

public interface IUpdateIncomeUseCase
{
    Task<ResponseIncomeJson> Execute(long id, RequestUpdateIncomeJson request);
}
