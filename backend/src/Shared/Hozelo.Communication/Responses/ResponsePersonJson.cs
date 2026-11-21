namespace Hozelo.Communication.Responses;

public class ResponsePersonJson
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>Cobranças até o mês atual menos pagamentos até hoje.</summary>
    public decimal BalanceUntilNow { get; set; }

    /// <summary>Saldo anterior + cobranças do mês atual − pagamentos do mês atual.</summary>
    public decimal CurrentMonthDue { get; set; }
}

public class ResponsePeopleJson
{
    public IList<ResponsePersonJson> People { get; set; } = [];
}
