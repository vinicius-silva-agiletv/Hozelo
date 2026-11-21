using Hozelo.Domain.Entities;
using Hozelo.Domain.Enums;

namespace Hozelo.Domain.Calculations;

/// <summary>Gera as cobranças de despesas e contas fixas marcadas e de cobranças avulsas (research.md 004 §4).</summary>
public static class ChargeCalculator
{
    public static IEnumerable<Charge> ForExpense(Expense expense)
    {
        if (expense.PersonPercent is not int percent)
            yield break;

        var installments = expense.Installments.OrderBy(i => i.Number).ToList();
        // Valor efetivo: o pago (amortização com desconto também é da pessoa) ou o valor da parcela.
        var effective = installments.Select(i => i.PaidAmount ?? i.Amount).ToList();

        IReadOnlyList<decimal> shares = percent == 100
            ? effective
            : InstallmentCalculator.DistributePayment(effective, Share(effective.Sum(), percent));

        for (var i = 0; i < installments.Count; i++)
        {
            if (shares[i] <= 0)
                continue;

            var installment = installments[i];
            // Regra da 002: antecipada pertence ao mês do pagamento.
            var paidInAdvance = installment.PaidOn.HasValue && installment.PaidOn.Value < YearMonth.FirstDay(installment.DueDate);
            var date = paidInAdvance ? installment.PaidOn!.Value : installment.DueDate;

            yield return new Charge
            {
                Key = $"Installment:{installment.Id}",
                OriginType = ChargeOriginType.Expense,
                OriginId = expense.Id,
                Description = expense.Name,
                Number = installment.Number,
                Count = expense.InstallmentsCount,
                Month = YearMonth.FirstDay(date),
                Date = date,
                Amount = shares[i]
            };
        }
    }

    /// <summary>Ocorrências da conta fixa marcada nos meses em [<paramref name="from"/>, <paramref name="to"/>).</summary>
    public static IEnumerable<Charge> ForRecurrence(RecurringEntry entry, DateOnly from, DateOnly to)
    {
        if (entry.PersonPercent is not int percent)
            yield break;

        foreach (var occurrence in RecurrenceCalculator.Between(entry, from, to))
        {
            var amount = Share(occurrence.Amount, percent);
            if (amount <= 0)
                continue;

            yield return new Charge
            {
                Key = $"Recurrence:{entry.Id}:{YearMonth.Format(occurrence.Month)}",
                OriginType = ChargeOriginType.Recurrence,
                OriginId = entry.Id,
                Description = entry.Name,
                Month = occurrence.Month,
                Date = occurrence.Date,
                Amount = amount
            };
        }
    }

    public static Charge ForManual(PersonCharge charge) => new()
    {
        Key = $"Manual:{charge.Id}",
        OriginType = ChargeOriginType.Manual,
        OriginId = charge.Id,
        Description = charge.Description,
        Month = YearMonth.FirstDay(charge.ChargeDate),
        Date = charge.ChargeDate,
        Amount = charge.Amount
    };

    private static decimal Share(decimal amount, int percent) =>
        InstallmentCalculator.FromCents(
            (long)Math.Round(InstallmentCalculator.ToCents(amount) * percent / 100m, MidpointRounding.AwayFromZero));
}
