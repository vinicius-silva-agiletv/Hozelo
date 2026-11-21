namespace Hozelo.Communication.Requests;

public class RequestRegisterExpenseJson : RequestUpdateExpenseJson
{
    /// <summary>Parcelas já pagas de uma dívida em andamento (as N primeiras).</summary>
    public int AlreadyPaidInstallments { get; set; }
}
