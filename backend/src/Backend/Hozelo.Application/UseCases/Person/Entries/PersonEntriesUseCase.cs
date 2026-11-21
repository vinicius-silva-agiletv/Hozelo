using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Calculations;
using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Person;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Person.Entries;

public sealed class PersonEntriesUseCase(
    ILoggedUser loggedUser,
    IPersonReadOnlyRepository personRepository,
    IPersonChargeRepository chargeRepository,
    IPersonPaymentRepository paymentRepository,
    IPersonLedgerLoader ledgerLoader,
    IUnitOfWork unitOfWork,
    ICalendar calendar,
    TimeProvider timeProvider) : IPersonEntriesUseCase
{
    // ------------------------------------------------------------ cobranças avulsas
    public async Task<ResponsePersonChargeJson> RegisterCharge(long personId, RequestPersonChargeJson request)
    {
        var userId = await PersonOwner(personId);
        ValidateCharge(request);

        var charge = new PersonCharge { UserId = userId, PersonId = personId, CreatedOn = timeProvider.GetUtcNow().UtcDateTime };
        Apply(charge, request);

        await chargeRepository.Add(charge);
        await unitOfWork.Commit();

        return ToResponse(charge);
    }

    public async Task<ResponsePersonChargeJson> UpdateCharge(long personId, long chargeId, RequestPersonChargeJson request)
    {
        var userId = await PersonOwner(personId);

        var charge = await chargeRepository.GetForUpdate(userId, personId, chargeId)
            ?? throw new NotFoundException(ResourceMessagesException.CHARGE_NOT_FOUND);

        ValidateCharge(request);
        Apply(charge, request);
        await unitOfWork.Commit();

        return ToResponse(charge);
    }

    public async Task DeleteCharge(long personId, long chargeId)
    {
        var userId = await PersonOwner(personId);

        var charge = await chargeRepository.GetForUpdate(userId, personId, chargeId)
            ?? throw new NotFoundException(ResourceMessagesException.CHARGE_NOT_FOUND);

        chargeRepository.Delete(charge);
        await unitOfWork.Commit();
    }

    // ------------------------------------------------------------ pagamentos
    public async Task<ResponsePersonPaymentJson> RegisterPayment(long personId, RequestPersonPaymentJson request)
    {
        var userId = await PersonOwner(personId);
        var keys = await ValidatePayment(userId, personId, request, excludingPaymentId: null);

        var payment = new PersonPayment { UserId = userId, PersonId = personId, CreatedOn = timeProvider.GetUtcNow().UtcDateTime };
        Apply(payment, request, keys);

        await paymentRepository.Add(payment);
        await unitOfWork.Commit();

        return ToResponse(payment);
    }

    public async Task<ResponsePersonPaymentJson> UpdatePayment(long personId, long paymentId, RequestPersonPaymentJson request)
    {
        var userId = await PersonOwner(personId);

        var payment = await paymentRepository.GetForUpdate(userId, personId, paymentId)
            ?? throw new NotFoundException(ResourceMessagesException.PAYMENT_NOT_FOUND);

        var keys = await ValidatePayment(userId, personId, request, excludingPaymentId: paymentId);
        Apply(payment, request, keys);
        await unitOfWork.Commit();

        return ToResponse(payment);
    }

    public async Task DeletePayment(long personId, long paymentId)
    {
        var userId = await PersonOwner(personId);

        var payment = await paymentRepository.GetForUpdate(userId, personId, paymentId)
            ?? throw new NotFoundException(ResourceMessagesException.PAYMENT_NOT_FOUND);

        paymentRepository.Delete(payment);
        await unitOfWork.Commit();
    }

    // ------------------------------------------------------------ apoio
    private async Task<long> PersonOwner(long personId)
    {
        var user = await loggedUser.User();

        _ = await personRepository.GetById(user.Id, personId)
            ?? throw new NotFoundException(ResourceMessagesException.PERSON_NOT_FOUND);

        return user.Id;
    }

    private static void ValidateCharge(RequestPersonChargeJson request)
    {
        request.Description = request.Description?.Trim() ?? string.Empty;
        request.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        ValidationErrors.ThrowIfAny(new PersonChargeValidator().Validate(request).Messages());
    }

    /// <summary>
    /// Valida o pagamento; as cobranças escolhidas precisam existir, ser da pessoa e não estar totalmente pagas pelo
    /// estado calculado sem este pagamento (research.md 004 §5).
    /// </summary>
    private async Task<IList<string>> ValidatePayment(long userId, long personId, RequestPersonPaymentJson request, long? excludingPaymentId)
    {
        request.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        var errors = new PersonPaymentValidator().Validate(request).Messages();

        if (request.PaidOn > calendar.Today())
            errors.Add(ResourceMessagesException.DATE_IN_FUTURE);

        ValidationErrors.ThrowIfAny(errors);

        var keys = (request.ChargeKeys ?? []).Select(k => k?.Trim() ?? string.Empty).ToList();
        if (keys.Count == 0)
            return keys;

        var ledgers = await ledgerLoader.Load(userId, personId, OpenEndedLimit(keys));
        var ledger = ledgers.GetValueOrDefault(personId) ?? PersonLedger.Empty;
        var allocation = PaymentAllocator.Allocate(ledger.Charges, ledger.Payments.Where(p => p.Id != excludingPaymentId));

        var valid = keys.Distinct().Count() == keys.Count
            && keys.All(k => allocation.Charges.TryGetValue(k, out var charge) && charge.Remaining > 0);

        if (!valid)
            throw new ErrorOnValidationException([ResourceMessagesException.PAYMENT_TARGETS_INVALID]);

        return keys;
    }

    /// <summary>Contas fixas sem fim: carrega até o mês atual ou até o mês mais distante escolhido.</summary>
    private DateOnly OpenEndedLimit(IEnumerable<string> keys)
    {
        var limit = YearMonth.FirstDay(calendar.Today());

        foreach (var key in keys)
        {
            var parts = key.Split(':');
            if (parts.Length == 3 && parts[0] == "Recurrence" && YearMonth.TryParse(parts[2], out var month) && month > limit)
                limit = month;
        }

        return limit.AddMonths(1);
    }

    private static void Apply(PersonCharge charge, RequestPersonChargeJson request)
    {
        charge.Description = request.Description;
        charge.Amount = request.Amount;
        charge.ChargeDate = request.ChargeDate!.Value;
        charge.Notes = request.Notes;
    }

    private static void Apply(PersonPayment payment, RequestPersonPaymentJson request, IEnumerable<string> keys)
    {
        payment.Amount = request.Amount;
        payment.PaidOn = request.PaidOn!.Value;
        payment.Notes = request.Notes;
        payment.SetTargets(keys);
    }

    private static ResponsePersonChargeJson ToResponse(PersonCharge charge) => new()
    {
        Id = charge.Id,
        Key = $"Manual:{charge.Id}",
        Description = charge.Description,
        Amount = charge.Amount,
        ChargeDate = charge.ChargeDate,
        Notes = charge.Notes
    };

    public static ResponsePersonPaymentJson ToResponse(PersonPayment payment) => new()
    {
        Id = payment.Id,
        Amount = payment.Amount,
        PaidOn = payment.PaidOn,
        Notes = payment.Notes,
        ChargeKeys = payment.TargetKeys.ToList()
    };
}
