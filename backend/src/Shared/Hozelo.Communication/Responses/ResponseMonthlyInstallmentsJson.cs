namespace Hozelo.Communication.Responses;

public class ResponseMonthlyInstallmentsJson
{
    public int Year { get; set; }

    public int Month { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal PaidAmount { get; set; }

    public decimal OpenAmount { get; set; }

    public IList<ResponseMonthlyInstallmentJson> Installments { get; set; } = [];
}
