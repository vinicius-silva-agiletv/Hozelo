using Hozelo.Domain.Calculations;
using Hozelo.Domain.Enums;

namespace Hozelo.Domain.Entities;

/// <summary>Compromisso financeiro (conta, compra, dívida) com suas parcelas (data-model.md, Expense).</summary>
public class Expense : EntityBase
{
    public long UserId { get; set; }

    public long CategoryId { get; set; }

    public Category Category { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public AmountType AmountType { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal InstallmentAmount { get; set; }

    public int InstallmentsCount { get; set; }

    public DateOnly FirstDueDate { get; set; }

    public string? Notes { get; set; }

    /// <summary>Pessoa de quem é esta despesa/conta fixa (feature 004); null = só da família.</summary>
    public long? PersonId { get; set; }

    /// <summary>Parte da pessoa (1–100); null quando não há pessoa.</summary>
    public int? PersonPercent { get; set; }

    public Person? Person { get; set; }

    public IList<ExpenseInstallment> Installments { get; set; } = [];

    /// <summary>Valor que a família informou (total ou da parcela, conforme <see cref="AmountType"/>).</summary>
    public decimal InformedAmount => AmountType == AmountType.Total ? TotalAmount : InstallmentAmount;

    /// <summary>Gera (ou regera) o cronograma de parcelas a partir dos dados informados.</summary>
    public void Schedule(AmountType amountType, decimal amount, int count, DateOnly firstDueDate)
    {
        var schedule = InstallmentCalculator.BuildSchedule(amountType, amount, count, firstDueDate);

        AmountType = amountType;
        TotalAmount = schedule.TotalAmount;
        InstallmentAmount = schedule.InstallmentAmount;
        InstallmentsCount = count;
        FirstDueDate = firstDueDate;

        // Reaproveita as parcelas existentes (atualiza no lugar) para não violar o índice
        // único (expense_id, number) ao gravar; sobras são removidas e faltantes, criadas.
        var ordered = Installments.OrderBy(i => i.Number).ToList();

        foreach (var surplus in ordered.Skip(count))
            Installments.Remove(surplus);

        for (var i = 0; i < count; i++)
        {
            var scheduled = schedule.Installments[i];
            var isNew = i >= ordered.Count;
            var installment = isNew ? new ExpenseInstallment() : ordered[i];

            installment.Number = scheduled.Number;
            installment.DueDate = scheduled.DueDate;
            installment.Amount = scheduled.Amount;

            if (isNew)
                Installments.Add(installment);
        }
    }

    /// <summary>Dívida já em andamento: as N primeiras parcelas ficam pagas no próprio vencimento.</summary>
    public void MarkFirstInstallmentsAsPaid(int quantity)
    {
        foreach (var installment in Installments.OrderBy(i => i.Number).Take(quantity))
            installment.Pay(installment.DueDate);
    }

    /// <summary>
    /// Recalcula as parcelas após mudança de valor, quantidade ou data (research.md §11): mantém pagas as
    /// N primeiras, reaproveitando as datas de pagamento antigas em ordem cronológica. O chamador garante
    /// que não há parcelas amortizadas e que a nova quantidade comporta as pagas.
    /// </summary>
    public void Reschedule(AmountType amountType, decimal amount, int count, DateOnly firstDueDate)
    {
        var paidDates = Installments
            .Where(i => i.IsPaid)
            .Select(i => i.PaidOn!.Value)
            .Order()
            .ToList();

        foreach (var installment in Installments)
            installment.UndoPayment();

        Schedule(amountType, amount, count, firstDueDate);

        var firsts = Installments.OrderBy(i => i.Number).Take(paidDates.Count).ToList();
        for (var i = 0; i < firsts.Count; i++)
            firsts[i].Pay(paidDates[i]);
    }
}
