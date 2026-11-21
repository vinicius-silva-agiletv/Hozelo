using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Installment.GetMonthly;

public interface IGetMonthlyInstallmentsUseCase
{
    Task<ResponseMonthlyInstallmentsJson> Execute(int? year, int? month, long? categoryId);
}
