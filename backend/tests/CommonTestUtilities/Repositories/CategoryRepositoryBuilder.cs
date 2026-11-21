using Hozelo.Domain.Entities;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories.Category;
using Moq;

namespace CommonTestUtilities.Repositories;

/// <summary>Mocks dos repositórios de categoria com configuração fluente.</summary>
public class CategoryRepositoryBuilder
{
    public Mock<ICategoryReadOnlyRepository> ReadOnly { get; } = new();
    public Mock<ICategoryWriteOnlyRepository> WriteOnly { get; } = new();
    public Mock<ICategoryUpdateOnlyRepository> UpdateOnly { get; } = new();

    public CategoryRepositoryBuilder WithCategory(Category category)
    {
        ReadOnly.Setup(r => r.GetById(category.UserId, category.Id)).ReturnsAsync(category);
        UpdateOnly.Setup(r => r.GetById(category.UserId, category.Id)).ReturnsAsync(category);
        return this;
    }

    public CategoryRepositoryBuilder WithExistingName(string name)
    {
        ReadOnly.Setup(r => r.ExistsWithName(It.IsAny<long>(), It.IsAny<CategoryType>(), It.Is<string>(n => n.ToLower() == name.ToLower()), It.IsAny<long?>()))
            .ReturnsAsync(true);
        return this;
    }

    public CategoryRepositoryBuilder WithEntries(long categoryId)
    {
        ReadOnly.Setup(r => r.HasEntries(It.IsAny<long>(), categoryId)).ReturnsAsync(true);
        return this;
    }

    public CategoryRepositoryBuilder WithAll(params CategoryWithEntriesCount[] categories)
    {
        ReadOnly.Setup(r => r.GetAll(It.IsAny<long>(), It.IsAny<CategoryType?>()))
            .ReturnsAsync((long _, CategoryType? type) => categories.Where(c => type == null || c.Category.Type == type).ToList());
        return this;
    }
}
