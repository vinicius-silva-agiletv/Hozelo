using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Income.GetById;

public interface IGetIncomeByIdUseCase
{
    Task<ResponseIncomeJson> Execute(long id);
}
