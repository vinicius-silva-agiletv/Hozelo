using Hozelo.Domain.Entities;

namespace Hozelo.Domain.Repositories.Person;

public interface IPersonPaymentRepository
{
    /// <summary>Pagamentos com cobranças escolhidas (sem rastreamento), de uma pessoa ou de todas.</summary>
    Task<IList<PersonPayment>> GetAll(long userId, long? personId);

    /// <summary>Pagamento rastreado com as cobranças escolhidas.</summary>
    Task<PersonPayment?> GetForUpdate(long userId, long personId, long paymentId);

    Task Add(PersonPayment payment);

    void Delete(PersonPayment payment);
}
