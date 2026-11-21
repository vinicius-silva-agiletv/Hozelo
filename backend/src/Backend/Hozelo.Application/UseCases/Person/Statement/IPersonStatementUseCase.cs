using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Person.Statement;

public interface IPersonStatementUseCase
{
    Task<ResponsePersonStatementJson> Statement(long personId, int? year, int? month);

    Task<ResponsePersonOverviewJson> Summary(long personId);
}
