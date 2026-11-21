using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Recurrence.Register;

public interface IRegisterRecurrenceUseCase
{
    Task<ResponseRecurrenceJson> Execute(RequestRecurrenceJson request);
}
