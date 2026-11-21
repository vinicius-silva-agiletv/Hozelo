namespace Hozelo.Domain.Entities;

/// <summary>Agrupamento das despesas definido pela família (data-model.md, Category).</summary>
public class Category : EntityBase
{
    public long UserId { get; set; }

    /// <summary>Sem espaços nas pontas; único por usuário ignorando maiúsculas/minúsculas.</summary>
    public string Name { get; set; } = string.Empty;
}
