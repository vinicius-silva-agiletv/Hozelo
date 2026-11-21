using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Recurrence.Update;

public interface IUpdateRecurrenceUseCase
{
    Task<ResponseRecurrenceJson> Execute(long id, RequestUpdateRecurrenceJson request);
}
