namespace Hozelo.Domain.Entities;

/// <summary>Cada pagamento mensal de uma despesa (data-model.md, ExpenseInstallment).</summary>
public class ExpenseInstallment
{
    public long Id { get; set; }

    public long ExpenseId { get; set; }

    public int Number { get; set; }

    public DateOnly DueDate { get; set; }

    public decimal Amount { get; set; }

    public DateOnly? PaidOn { get; set; }

    public decimal? PaidAmount { get; set; }

    /// <summary>Paga por amortização (antecipação com valor informado).</summary>
    public bool Prepaid { get; set; }

    public Expense Expense { get; set; } = null!;

    public bool IsPaid => PaidOn.HasValue;

    public decimal Discount => IsPaid ? Amount - PaidAmount!.Value : 0m;

    /// <summary>Paga pelo valor cheio. Idempotente: parcela já paga não muda.</summary>
    public void Pay(DateOnly paidOn)
    {
        if (IsPaid)
            return;

        PaidOn = paidOn;
        PaidAmount = Amount;
        Prepaid = false;
    }

    /// <summary>Paga antecipadamente com o valor efetivamente pago (pode ter desconto).</summary>
    public void PayInAdvance(DateOnly paidOn, decimal paidAmount)
    {
        PaidOn = paidOn;
        PaidAmount = paidAmount;
        Prepaid = true;
    }

    /// <summary>Volta a ficar em aberto. Idempotente.</summary>
    public void UndoPayment()
    {
        PaidOn = null;
        PaidAmount = null;
        Prepaid = false;
    }
}
