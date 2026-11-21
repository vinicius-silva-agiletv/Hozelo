namespace Hozelo.Communication.Requests;

/// <summary>Informe <see cref="InstallmentNumbers"/> ou <see cref="Quantity"/> (as últimas em aberto).</summary>
public class RequestAmortizeExpenseJson
{
    public IList<int>? InstallmentNumbers { get; set; }

    public int? Quantity { get; set; }

    /// <summary>Padrão: hoje.</summary>
    public DateOnly? PaidOn { get; set; }

    public decimal PaidAmount { get; set; }
}
