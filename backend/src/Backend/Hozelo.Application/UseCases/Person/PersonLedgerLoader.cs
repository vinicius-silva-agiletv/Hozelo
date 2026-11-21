using Hozelo.Domain.Calculations;
using Hozelo.Domain.Repositories.Expense;
using Hozelo.Domain.Repositories.Person;
using Hozelo.Domain.Repositories.Recurrence;

namespace Hozelo.Application.UseCases.Person;

/// <summary>Cobranças (calculadas + avulsas) e pagamentos de uma pessoa.</summary>
public sealed record PersonLedger(IReadOnlyList<Charge> Charges, IReadOnlyList<PaymentInput> Payments, IReadOnlySet<long> OpenEndedRecurrenceIds)
{
    public static readonly PersonLedger Empty = new([], [], new HashSet<long>());
}

public interface IPersonLedgerLoader
{
    /// <summary>
    /// Razão por pessoa (todas as pessoas quando <paramref name="personId"/> é null). Contas fixas sem mês final geram
    /// cobranças só até antes de <paramref name="openEndedUntil"/> (exclusivo).
    /// </summary>
    Task<IReadOnlyDictionary<long, PersonLedger>> Load(long userId, long? personId, DateOnly openEndedUntil);
}

public sealed class PersonLedgerLoader(
    IExpenseReadOnlyRepository expenseRepository,
    IRecurrenceReadOnlyRepository recurrenceRepository,
    IPersonChargeRepository chargeRepository,
    IPersonPaymentRepository paymentRepository) : IPersonLedgerLoader
{
    public async Task<IReadOnlyDictionary<long, PersonLedger>> Load(long userId, long? personId, DateOnly openEndedUntil)
    {
        var charges = new Dictionary<long, List<Charge>>();
        var payments = new Dictionary<long, List<PaymentInput>>();
        var openEnded = new Dictionary<long, HashSet<long>>();

        List<Charge> ChargesOf(long id) => charges.TryGetValue(id, out var list) ? list : charges[id] = [];

        foreach (var expense in await expenseRepository.GetMarked(userId, personId))
            ChargesOf(expense.PersonId!.Value).AddRange(ChargeCalculator.ForExpense(expense));

        foreach (var entry in await recurrenceRepository.GetMarked(userId, personId))
        {
            var until = entry.EndMonth?.AddMonths(1) ?? openEndedUntil;
            ChargesOf(entry.PersonId!.Value).AddRange(ChargeCalculator.ForRecurrence(entry, entry.StartMonth, until));

            if (entry.EndMonth is null)
            {
                if (!openEnded.TryGetValue(entry.PersonId!.Value, out var set))
                    openEnded[entry.PersonId!.Value] = set = [];
                set.Add(entry.Id);
            }
        }

        foreach (var charge in await chargeRepository.GetAll(userId, personId))
            ChargesOf(charge.PersonId).Add(ChargeCalculator.ForManual(charge));

        foreach (var payment in await paymentRepository.GetAll(userId, personId))
        {
            if (!payments.TryGetValue(payment.PersonId, out var list))
                payments[payment.PersonId] = list = [];
            list.Add(new PaymentInput(payment.Id, payment.PaidOn, payment.Amount, payment.TargetKeys));
        }

        return charges.Keys.Union(payments.Keys).ToDictionary(
            id => id,
            id => new PersonLedger(
                charges.GetValueOrDefault(id) ?? [],
                payments.GetValueOrDefault(id) ?? [],
                openEnded.GetValueOrDefault(id) ?? new HashSet<long>()));
    }
}
