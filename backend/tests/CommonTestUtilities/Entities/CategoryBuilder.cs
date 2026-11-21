using Hozelo.Domain.Entities;
using Hozelo.Domain.Enums;

namespace CommonTestUtilities.Entities;

public static class CategoryBuilder
{
    public static Category Build(long id = 1, string name = "Carro", long userId = 1, CategoryType type = CategoryType.Expense) =>
        new() { Id = id, Name = name, UserId = userId, Type = type };
}
