namespace Hozelo.Domain.Calculations;

public sealed record PersonMonthStatement(
    decimal PreviousBalance,
    IReadOnlyList<Charge> Charges,
    IReadOnlyList<PaymentInput> Payments,
    decimal TotalCharges,
    decimal TotalPaid)
{
    public decimal TotalDue => PreviousBalance + TotalCharges;

    public decimal EndBalance => TotalDue - TotalPaid;
}

/// <summary>Extrato e saldos de uma pessoa (research.md 004 §7). Não depende do abatimento.</summary>
public static class PersonStatementCalculator
{
    public static PersonMonthStatement Month(IReadOnlyCollection<Charge> charges, IReadOnlyCollection<PaymentInput> payments, DateOnly month)
    {
        month = YearMonth.FirstDay(month);

        var previous = Sum(charges.Where(c => c.Month < month).Select(c => c.Amount))
            - Sum(payments.Where(p => YearMonth.FirstDay(p.PaidOn) < month).Select(p => p.Amount));

        var monthCharges = charges.Where(c => c.Month == month).OrderBy(c => c.Date).ThenBy(c => c.Key, StringComparer.Ordinal).ToList();
        var monthPayments = payments.Where(p => YearMonth.FirstDay(p.PaidOn) == month).OrderBy(p => p.PaidOn).ThenBy(p => p.Id).ToList();

        return new PersonMonthStatement(
            previous,
            monthCharges,
            monthPayments,
            Sum(monthCharges.Select(c => c.Amount)),
            Sum(monthPayments.Select(p => p.Amount)));
    }

    /// <summary>Cobranças até o mês atual menos pagamentos até hoje.</summary>
    public static decimal OwedUntilNow(IEnumerable<Charge> charges, IEnumerable<PaymentInput> payments, DateOnly today) =>
        Sum(charges.Where(c => c.Month <= YearMonth.FirstDay(today)).Select(c => c.Amount))
        - Sum(payments.Where(p => p.PaidOn <= today).Select(p => p.Amount));

    /// <summary>Todas as cobranças conhecidas menos todos os pagamentos.</summary>
    public static decimal OwedTotal(IEnumerable<Charge> charges, IEnumerable<PaymentInput> payments) =>
        Sum(charges.Select(c => c.Amount)) - Sum(payments.Select(p => p.Amount));

    private static decimal Sum(IEnumerable<decimal> values) => values.Aggregate(0.00m, (t, v) => t + v);
}
