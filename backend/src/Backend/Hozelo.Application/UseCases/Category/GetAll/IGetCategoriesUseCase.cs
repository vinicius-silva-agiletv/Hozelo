using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Category.GetAll;

public interface IGetCategoriesUseCase
{
    Task<ResponseCategoriesJson> Execute();
}
