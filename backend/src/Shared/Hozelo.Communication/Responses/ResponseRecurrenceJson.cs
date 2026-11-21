namespace Hozelo.Communication.Responses;

public class ResponseRecurrenceJson : ResponseShortRecurrenceJson
{
    public IList<ResponseRecurrenceAmountJson> Amounts { get; set; } = [];

    public IList<ResponseRecurrenceMonthJson> Months { get; set; } = [];
}

public class ResponseRecurrenceAmountJson
{
    public string FromMonth { get; set; } = string.Empty;

    public decimal Amount { get; set; }
}

public class ResponseRecurrenceMonthJson
{
    public string Month { get; set; } = string.Empty;

    public decimal? Amount { get; set; }

    public bool Skipped { get; set; }

    public DateOnly? SettledOn { get; set; }
}
