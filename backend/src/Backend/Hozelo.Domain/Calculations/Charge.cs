using Hozelo.Domain.Enums;

namespace Hozelo.Domain.Calculations;

/// <summary>
/// Cobrança de uma pessoa (research.md 004 §3–§4): calculada para despesas e contas fixas marcadas, gravada para
/// avulsas. <see cref="Key"/> é estável e usada para escolher cobranças nos pagamentos.
/// </summary>
public sealed record Charge
{
    public required string Key { get; init; }

    public required ChargeOriginType OriginType { get; init; }

    public required long OriginId { get; init; }

    public required string Description { get; init; }

    public int? Number { get; init; }

    public int? Count { get; init; }

    /// <summary>Primeiro dia do mês de referência.</summary>
    public required DateOnly Month { get; init; }

    public required DateOnly Date { get; init; }

    public required decimal Amount { get; init; }

    public string OriginKey => $"{OriginType}:{OriginId}";
}
