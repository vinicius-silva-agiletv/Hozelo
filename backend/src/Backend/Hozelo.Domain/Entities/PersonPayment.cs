namespace Hozelo.Domain.Entities;

/// <summary>Valor que a pessoa mandou (data-model.md, PersonPayment).</summary>
public class PersonPayment : EntityBase
{
    public long UserId { get; set; }

    public long PersonId { get; set; }

    public decimal Amount { get; set; }

    public DateOnly PaidOn { get; set; }

    public string? Notes { get; set; }

    /// <summary>Cobranças escolhidas que este pagamento quita primeiro (opcional).</summary>
    public IList<PersonPaymentTarget> Targets { get; set; } = [];

    public IReadOnlyList<string> TargetKeys => Targets.OrderBy(t => t.Position).Select(t => t.ChargeKey).ToList();

    public void SetTargets(IEnumerable<string> keys)
    {
        Targets.Clear();
        var position = 0;
        foreach (var key in keys)
            Targets.Add(new PersonPaymentTarget { ChargeKey = key, Position = position++ });
    }
}

public class PersonPaymentTarget
{
    public long Id { get; set; }

    public long PersonPaymentId { get; set; }

    public string ChargeKey { get; set; } = string.Empty;

    public int Position { get; set; }
}
