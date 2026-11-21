using Hozelo.Domain.Enums;

namespace Hozelo.Domain.Calculations;

public sealed record ScheduledInstallment(int Number, DateOnly DueDate, decimal Amount);

public sealed record InstallmentSchedule(
    decimal TotalAmount,
    decimal InstallmentAmount,
    IReadOnlyList<ScheduledInstallment> Installments);

/// <summary>
/// Regras de dinheiro e calendário das parcelas, sempre em centavos inteiros
/// (research.md §1, §3 e §4).
/// </summary>
public static class InstallmentCalculator
{
    /// <summary>Gera o cronograma: valores das parcelas (sobra na última) e vencimentos mensais.</summary>
    public static InstallmentSchedule BuildSchedule(AmountType amountType, decimal amount, int count, DateOnly firstDueDate)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(count, 1);

        var amountCents = ToCents(amount);

        long installmentCents, totalCents;
        if (amountType == AmountType.Total)
        {
            totalCents = amountCents;
            installmentCents = totalCents / count;
        }
        else
        {
            installmentCents = amountCents;
            totalCents = installmentCents * count;
        }

        var lastCents = totalCents - installmentCents * (count - 1);

        var installments = Enumerable.Range(0, count)
            .Select(i => new ScheduledInstallment(
                Number: i + 1,
                DueDate: DueDate(firstDueDate, i),
                Amount: FromCents(i == count - 1 ? lastCents : installmentCents)))
            .ToList();

        return new InstallmentSchedule(FromCents(totalCents), FromCents(installmentCents), installments);
    }

    /// <summary>
    /// Vencimento da parcela de índice <paramref name="index"/> (0 = primeira): mesmo dia da primeira
    /// parcela, limitado ao último dia do mês (31/01 → 28/02 → 31/03).
    /// </summary>
    public static DateOnly DueDate(DateOnly firstDueDate, int index)
    {
        var month = new DateOnly(firstDueDate.Year, firstDueDate.Month, 1).AddMonths(index);
        var day = Math.Min(firstDueDate.Day, DateTime.DaysInMonth(month.Year, month.Month));

        return new DateOnly(month.Year, month.Month, day);
    }

    /// <summary>
    /// Reparte <paramref name="paidAmount"/> proporcionalmente aos valores, pelo método do maior resto:
    /// a soma é exata e nenhuma cota passa do valor correspondente quando o pago ≤ soma.
    /// </summary>
    public static IReadOnlyList<decimal> DistributePayment(IReadOnlyList<decimal> amounts, decimal paidAmount)
    {
        if (amounts.Count == 0)
            return [];

        var amountCents = amounts.Select(ToCents).ToArray();
        var totalCents = amountCents.Sum();
        var paidCents = ToCents(paidAmount);

        var shares = new long[amountCents.Length];
        var remainders = new long[amountCents.Length];

        for (var i = 0; i < amountCents.Length; i++)
        {
            var product = (decimal)amountCents[i] * paidCents;
            shares[i] = (long)Math.Floor(product / totalCents);
            remainders[i] = (long)(product - (decimal)shares[i] * totalCents);
        }

        var leftover = paidCents - shares.Sum();

        // Centavos restantes para os maiores restos; empate vai para a parcela mais ao fim.
        var order = Enumerable.Range(0, amountCents.Length)
            .OrderByDescending(i => remainders[i])
            .ThenByDescending(i => i)
            .Take((int)leftover);

        foreach (var i in order)
            shares[i]++;

        return shares.Select(FromCents).ToList();
    }

    public static bool HasAtMostTwoDecimals(decimal value) => value == Math.Round(value, 2);

    public static long ToCents(decimal value) => (long)Math.Round(value * 100m, MidpointRounding.AwayFromZero);

    // Multiplicar por 0.01m mantém 2 casas decimais na representação (ex.: 1250.00).
    public static decimal FromCents(long cents) => cents * 0.01m;
}
