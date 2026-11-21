using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Domain.Services.LoggedUser;

namespace Hozelo.Application.UseCases.Category.GetAll;

public sealed class GetCategoriesUseCase(
    ILoggedUser loggedUser,
    ICategoryReadOnlyRepository readOnlyRepository) : IGetCategoriesUseCase
{
    public async Task<ResponseCategoriesJson> Execute(string? type = null)
    {
        var typeFilter = CategoryChecker.ParseType(type);

        var user = await loggedUser.User();

        var categories = await readOnlyRepository.GetAll(user.Id, typeFilter);

        return new ResponseCategoriesJson
        {
            Categories = categories
                .Select(c => new ResponseCategoryJson
                {
                    Id = c.Category.Id,
                    Name = c.Category.Name,
                    Type = (Communication.Enums.CategoryType)(int)c.Category.Type,
                    EntriesCount = c.EntriesCount
                })
                .ToList()
        };
    }
}
