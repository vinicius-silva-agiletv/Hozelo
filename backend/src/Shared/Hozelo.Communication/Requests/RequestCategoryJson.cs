using Hozelo.Communication.Enums;

namespace Hozelo.Communication.Requests;

public class RequestCategoryJson
{
    public string Name { get; set; } = string.Empty;

    /// <summary>Opcional: padrão Expense na criação; na edição, se informado, precisa ser o tipo atual.</summary>
    public CategoryType? Type { get; set; }
}
