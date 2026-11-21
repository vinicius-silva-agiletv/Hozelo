using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Income.Receive;

public interface IReceiveIncomeUseCase
{
    Task<ResponseIncomeJson> Execute(long id, RequestReceiveIncomeJson? request);

    Task<ResponseIncomeJson> Undo(long id);
}
