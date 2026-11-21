namespace Hozelo.Communication.Requests;

public class RequestIncomeJson : RequestUpdateIncomeJson
{
    /// <summary>Opcional: registrar já como recebida nesta data (não futura).</summary>
    public DateOnly? ReceivedOn { get; set; }
}
