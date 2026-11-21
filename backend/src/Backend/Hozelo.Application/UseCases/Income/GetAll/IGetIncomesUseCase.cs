using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Income.GetAll;

public interface IGetIncomesUseCase
{
    Task<ResponseIncomesJson> Execute(long? categoryId, int? year, int? month);
}
