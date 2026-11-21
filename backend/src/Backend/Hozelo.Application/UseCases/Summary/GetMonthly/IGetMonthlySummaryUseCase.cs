using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Summary.GetMonthly;

public interface IGetMonthlySummaryUseCase
{
    Task<ResponseMonthlySummaryJson> Execute(int? year, int? month, long? categoryId);
}
