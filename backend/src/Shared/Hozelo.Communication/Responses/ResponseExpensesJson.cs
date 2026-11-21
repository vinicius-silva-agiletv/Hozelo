namespace Hozelo.Communication.Responses;

public class ResponseExpensesJson
{
    public decimal TotalPaidAmount { get; set; }

    public decimal TotalRemainingAmount { get; set; }

    public decimal TotalDiscountAmount { get; set; }

    public IList<ResponseShortExpenseJson> Expenses { get; set; } = [];
}
