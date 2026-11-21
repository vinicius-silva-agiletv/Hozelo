namespace Hozelo.Communication.Requests;

public class RequestChangeRecurrenceAmountJson
{
    public decimal Amount { get; set; }

    /// <summary>"yyyy-MM": vale deste mês em diante.</summary>
    public string FromMonth { get; set; } = string.Empty;
}
