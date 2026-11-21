using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;

namespace Hozelo.Application.UseCases.Person.Entries;

/// <summary>Cobranças avulsas e pagamentos de uma pessoa.</summary>
public interface IPersonEntriesUseCase
{
    Task<ResponsePersonChargeJson> RegisterCharge(long personId, RequestPersonChargeJson request);

    Task<ResponsePersonChargeJson> UpdateCharge(long personId, long chargeId, RequestPersonChargeJson request);

    Task DeleteCharge(long personId, long chargeId);

    Task<ResponsePersonPaymentJson> RegisterPayment(long personId, RequestPersonPaymentJson request);

    Task<ResponsePersonPaymentJson> UpdatePayment(long personId, long paymentId, RequestPersonPaymentJson request);

    Task DeletePayment(long personId, long paymentId);
}
