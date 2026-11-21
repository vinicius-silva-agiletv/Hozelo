using Hozelo.Communication.Requests;

namespace Hozelo.Application.UseCases.Category.Update;

public interface IUpdateCategoryUseCase
{
    Task Execute(long id, RequestCategoryJson request);
}
