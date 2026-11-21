using Bogus;
using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;

namespace CommonTestUtilities.Requests;

public static class RequestCategoryJsonBuilder
{
    public static RequestCategoryJson Build(string? name = null, CategoryType? type = null) =>
        new() { Name = name ?? new Faker().Commerce.Department() + " " + Guid.NewGuid().ToString("N")[..6], Type = type };
}
