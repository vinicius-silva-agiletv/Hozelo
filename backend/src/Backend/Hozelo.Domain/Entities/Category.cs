using Hozelo.Domain.Enums;

namespace Hozelo.Domain.Entities;

/// <summary>Agrupamento das despesas definido pela família (data-model.md, Category).</summary>
public class Category : EntityBase
{
    public long UserId { get; set; }

    /// <summary>Despesa ou receita; não muda depois de criada.</summary>
    public CategoryType Type { get; set; } = CategoryType.Expense;

    /// <summary>Sem espaços nas pontas; único por usuário ignorando maiúsculas/minúsculas.</summary>
    public string Name { get; set; } = string.Empty;
}
