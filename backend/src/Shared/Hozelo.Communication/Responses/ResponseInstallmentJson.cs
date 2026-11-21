namespace Hozelo.Communication.Responses;

public class ResponseInstallmentJson
{
    public int Number { get; set; }

    public DateOnly DueDate { get; set; }

    public decimal Amount { get; set; }

    public bool IsPaid { get; set; }

    public DateOnly? PaidOn { get; set; }

    public decimal? PaidAmount { get; set; }

    public bool Prepaid { get; set; }
}
