using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Person;

public interface IPersonUseCase
{
    Task<ResponsePeopleJson> GetAll();

    Task<ResponsePersonJson> Register(RequestPersonJson request);

    Task Update(long id, RequestPersonJson request);

    Task Delete(long id);
}
