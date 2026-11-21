using Hozelo.Domain.Enums;

namespace Hozelo.Domain.Calculations;

public sealed record PaymentInput(long Id, DateOnly PaidOn, decimal Amount, IReadOnlyList<string> TargetKeys);

public sealed record ChargeAllocation(string Key, decimal Amount, decimal Paid, IReadOnlyList<long> PaymentIds)
{
    public decimal Remaining => Amount - Paid;

    public ChargeStatus Status => Paid <= 0 ? ChargeStatus.Open : Paid >= Amount ? ChargeStatus.Paid : ChargeStatus.Partial;
}

public sealed record AllocationResult(IReadOnlyDictionary<string, ChargeAllocation> Charges, decimal UnallocatedCredit);

/// <summary>
/// Abatimento dos pagamentos nas cobranças (research.md 004 §6): pagamentos em ordem de data; cada um quita primeiro
/// as cobranças escolhidas (em ordem cronológica), depois as mais antigas em aberto (incluindo futuras); a sobra é
/// crédito não alocado. Cálculo em centavos.
/// </summary>
public static class PaymentAllocator
{
    public static AllocationResult Allocate(IEnumerable<Charge> charges, IEnumerable<PaymentInput> payments)
    {
        var ordered = charges.OrderBy(c => c.Date).ThenBy(c => c.Key, StringComparer.Ordinal).ToList();
        var position = ordered.Select((c, i) => (c.Key, i)).ToDictionary(x => x.Key, x => x.i);

        var amount = ordered.Select(c => InstallmentCalculator.ToCents(c.Amount)).ToArray();
        var paid = new long[ordered.Count];
        var paymentIds = ordered.Select(_ => new List<long>()).ToArray();
        long credit = 0;

        foreach (var payment in payments.OrderBy(p => p.PaidOn).ThenBy(p => p.Id))
        {
            var remaining = InstallmentCalculator.ToCents(payment.Amount);

            var chosen = payment.TargetKeys
                .Where(position.ContainsKey)
                .Select(k => position[k])
                .Distinct()
                .Order();

            foreach (var index in chosen.Concat(Enumerable.Range(0, ordered.Count)))
            {
                if (remaining == 0)
                    break;

                var open = amount[index] - paid[index];
                if (open <= 0)
                    continue;

                var applied = Math.Min(open, remaining);
                paid[index] += applied;
                remaining -= applied;
                paymentIds[index].Add(payment.Id);
            }

            credit += remaining;
        }

        var result = ordered
            .Select((c, i) => new ChargeAllocation(c.Key, c.Amount, InstallmentCalculator.FromCents(paid[i]), paymentIds[i].Distinct().ToList()))
            .ToDictionary(a => a.Key);

        return new AllocationResult(result, InstallmentCalculator.FromCents(credit));
    }
}
