namespace Hozelo.Communication.Responses;

public class ResponseExpenseJson : ResponseShortExpenseJson
{
    public IList<ResponseInstallmentJson> Installments { get; set; } = [];
}
