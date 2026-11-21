using Hozelo.Domain.Entities;

namespace CommonTestUtilities.Entities;

public static class CategoryBuilder
{
    public static Category Build(long id = 1, string name = "Carro", long userId = 1) =>
        new() { Id = id, Name = name, UserId = userId };
}
