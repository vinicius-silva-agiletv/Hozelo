using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.Category;

public static class CategoryChecker
{
    /// <summary>
    /// Confere se a categoria existe, é do usuário e é do tipo esperado; acrescenta a mensagem de erro em
    /// <paramref name="errors"/> (para sair junto com os demais erros de validação) e devolve a categoria.
    /// </summary>
    public static async Task<Domain.Entities.Category?> Check(
        ICategoryReadOnlyRepository repository, long userId, long categoryId, CategoryType expected, IList<string> errors)
    {
        if (categoryId <= 0)
            return null;

        var category = await repository.GetById(userId, categoryId);

        if (category is null)
            errors.Add(ResourceMessagesException.EXPENSE_CATEGORY_NOT_EXISTS);
        else if (category.Type != expected)
            errors.Add(expected == CategoryType.Income
                ? ResourceMessagesException.CATEGORY_NOT_INCOME
                : ResourceMessagesException.CATEGORY_NOT_EXPENSE);

        return category;
    }

    public static CategoryType? ParseType(string? type)
    {
        if (string.IsNullOrWhiteSpace(type))
            return null;

        if (!int.TryParse(type, out _)
            && Enum.TryParse<CategoryType>(type, ignoreCase: true, out var parsed)
            && Enum.IsDefined(parsed))
            return parsed;

        throw new Exception.ExceptionsBase.ErrorOnValidationException([ResourceMessagesException.CATEGORY_TYPE_INVALID]);
    }
}
