using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Category.Register;

public interface IRegisterCategoryUseCase
{
    Task<ResponseCategoryJson> Execute(RequestCategoryJson request);
}
