namespace Hozelo.Domain.Entities;

/// <summary>Receita avulsa (data-model.md, Income). O mês de referência é o da data prevista.</summary>
public class Income : EntityBase
{
    public long UserId { get; set; }

    public long CategoryId { get; set; }

    public Category Category { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateOnly ExpectedDate { get; set; }

    public DateOnly? ReceivedOn { get; set; }

    public string? Notes { get; set; }

    public bool IsReceived => ReceivedOn.HasValue;

    /// <summary>Confirma o recebimento. Idempotente: mantém a primeira data.</summary>
    public void Receive(DateOnly receivedOn) => ReceivedOn ??= receivedOn;

    public void UndoReceipt() => ReceivedOn = null;
}
