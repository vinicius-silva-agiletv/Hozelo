using Hozelo.Communication.Enums;

namespace Hozelo.Communication.Responses;

public class ResponseCategoryJson
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public CategoryType Type { get; set; }

    /// <summary>Despesas, receitas e recorrências da categoria.</summary>
    public int EntriesCount { get; set; }
}
