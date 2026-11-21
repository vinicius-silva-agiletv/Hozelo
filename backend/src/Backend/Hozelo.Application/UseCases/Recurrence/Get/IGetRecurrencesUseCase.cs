using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Recurrence.Get;

public interface IGetRecurrencesUseCase
{
    Task<ResponseRecurrencesJson> GetAll(string? kind, long? categoryId);

    Task<ResponseRecurrenceJson> GetById(long id);
}
