using Hozelo.Communication.Enums;

namespace Hozelo.Communication.Responses;

public class ResponseMonthlySummaryJson
{
    public int Year { get; set; }

    public int Month { get; set; }

    public IList<ResponseLedgerItemJson> Incomes { get; set; } = [];

    public IList<ResponseLedgerItemJson> Expenses { get; set; } = [];

    public ResponseForecastJson Forecast { get; set; } = new();

    public ResponseRealizedJson Realized { get; set; } = new();

    /// <summary>Só no mês atual, com saldo inicial e sem filtro de categoria.</summary>
    public ResponsePendingJson? Pending { get; set; }

    /// <summary>Null com filtro de categoria, sem saldo inicial ou antes dele.</summary>
    public ResponseAccumulatedJson? Accumulated { get; set; }

    public bool OpeningBalanceMissing { get; set; }
}

public class ResponseLedgerItemJson
{
    public LedgerSource Source { get; set; }

    public long SourceId { get; set; }

    public EntryKind Direction { get; set; }

    public int? Number { get; set; }

    public int? InstallmentsCount { get; set; }

    public string Name { get; set; } = string.Empty;

    public ResponseCategorySummaryJson Category { get; set; } = new();

    /// <summary>Mês de referência "yyyy-MM".</summary>
    public string Month { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    public decimal Amount { get; set; }

    public bool IsSettled { get; set; }

    public DateOnly? SettledOn { get; set; }

    public bool PaidInAdvance { get; set; }
}

public class ResponseForecastJson
{
    public decimal Incomes { get; set; }

    public decimal Expenses { get; set; }

    public decimal Balance { get; set; }
}

public class ResponseRealizedJson
{
    public decimal Received { get; set; }

    public decimal Paid { get; set; }

    public decimal Balance { get; set; }
}

public class ResponsePendingJson
{
    public decimal ToReceive { get; set; }

    public decimal ToPay { get; set; }

    public IList<ResponseLedgerItemJson> Items { get; set; } = [];
}

public class ResponseAccumulatedJson
{
    public decimal PreviousBalance { get; set; }

    public decimal EndBalance { get; set; }
}
