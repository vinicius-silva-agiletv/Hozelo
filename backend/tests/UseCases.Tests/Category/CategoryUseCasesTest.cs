using CommonTestUtilities.Entities;
using CommonTestUtilities.Repositories;
using CommonTestUtilities.Requests;
using CommonTestUtilities.Services;
using Hozelo.Application.UseCases.Category.Delete;
using Hozelo.Application.UseCases.Category.GetAll;
using Hozelo.Application.UseCases.Category.Register;
using Hozelo.Application.UseCases.Category.Update;
using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Microsoft.Extensions.Time.Testing;
using Moq;
using Shouldly;

namespace UseCases.Tests.Category;

public class CategoryUseCasesTest
{
    private readonly Hozelo.Domain.Entities.User _user = UserBuilder.Build().user;

    [Fact]
    public async Task Register_Success_Trims_The_Name()
    {
        var repositories = new CategoryRepositoryBuilder();
        Hozelo.Domain.Entities.Category? added = null;
        repositories.WriteOnly.Setup(r => r.Add(It.IsAny<Hozelo.Domain.Entities.Category>()))
            .Callback<Hozelo.Domain.Entities.Category>(c => added = c);

        var result = await Register(repositories).Execute(RequestCategoryJsonBuilder.Build("  Luz  "));

        result.Name.ShouldBe("Luz");
        result.ExpensesCount.ShouldBe(0);
        added!.UserId.ShouldBe(_user.Id);
    }

    [Fact]
    public async Task Register_Error_Duplicated_Name()
    {
        var repositories = new CategoryRepositoryBuilder().WithExistingName("luz");

        var act = () => Register(repositories).Execute(RequestCategoryJsonBuilder.Build(" LUZ "));

        (await act.ShouldThrowAsync<ConflictException>()).Message
            .ShouldBe(ResourceMessagesException.CATEGORY_NAME_ALREADY_EXISTS);
    }

    [Fact]
    public async Task Register_Error_Empty_Name()
    {
        var act = () => Register(new CategoryRepositoryBuilder()).Execute(RequestCategoryJsonBuilder.Build("   "));

        (await act.ShouldThrowAsync<ErrorOnValidationException>()).GetErrorMessages()
            .ShouldBe([ResourceMessagesException.CATEGORY_NAME_EMPTY]);
    }

    [Fact]
    public async Task Update_Success()
    {
        var category = CategoryBuilder.Build(userId: _user.Id, name: "luz");
        var repositories = new CategoryRepositoryBuilder().WithCategory(category);

        await Update(repositories).Execute(category.Id, RequestCategoryJsonBuilder.Build("Luz"));

        category.Name.ShouldBe("Luz");
        repositories.ReadOnly.Verify(r => r.ExistsWithName(_user.Id, "Luz", category.Id));
    }

    [Fact]
    public async Task Update_Error_Not_Found()
    {
        var act = () => Update(new CategoryRepositoryBuilder()).Execute(99, RequestCategoryJsonBuilder.Build());

        (await act.ShouldThrowAsync<NotFoundException>()).Message.ShouldBe(ResourceMessagesException.CATEGORY_NOT_FOUND);
    }

    [Fact]
    public async Task Update_Error_Name_Of_Another_Category()
    {
        var category = CategoryBuilder.Build(userId: _user.Id);
        var repositories = new CategoryRepositoryBuilder().WithCategory(category).WithExistingName("Água");

        var act = () => Update(repositories).Execute(category.Id, RequestCategoryJsonBuilder.Build("água"));

        await act.ShouldThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Delete_Success()
    {
        var category = CategoryBuilder.Build(userId: _user.Id);
        var repositories = new CategoryRepositoryBuilder().WithCategory(category);

        await Delete(repositories).Execute(category.Id);

        repositories.WriteOnly.Verify(r => r.Delete(category));
    }

    [Fact]
    public async Task Delete_Error_Has_Expenses()
    {
        var category = CategoryBuilder.Build(userId: _user.Id);
        var repositories = new CategoryRepositoryBuilder().WithCategory(category).WithExpenses(category.Id);

        var act = () => Delete(repositories).Execute(category.Id);

        (await act.ShouldThrowAsync<ConflictException>()).Message.ShouldBe(ResourceMessagesException.CATEGORY_HAS_EXPENSES);
        repositories.WriteOnly.Verify(r => r.Delete(It.IsAny<Hozelo.Domain.Entities.Category>()), Times.Never);
    }

    [Fact]
    public async Task Delete_Error_Not_Found()
    {
        var act = () => Delete(new CategoryRepositoryBuilder()).Execute(5);

        await act.ShouldThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetAll_Maps_Count()
    {
        var repositories = new CategoryRepositoryBuilder().WithAll(
            new CategoryWithExpensesCount(CategoryBuilder.Build(1, "Água"), 0),
            new CategoryWithExpensesCount(CategoryBuilder.Build(2, "Carro"), 2));

        var result = await new GetCategoriesUseCase(LoggedUserBuilder.Build(_user), repositories.ReadOnly.Object).Execute();

        result.Categories.Select(c => (c.Name, c.ExpensesCount)).ShouldBe([("Água", 0), ("Carro", 2)]);
    }

    private RegisterCategoryUseCase Register(CategoryRepositoryBuilder r) => new(
        LoggedUserBuilder.Build(_user), r.ReadOnly.Object, r.WriteOnly.Object, UnitOfWorkBuilder.Build(), new FakeTimeProvider());

    private UpdateCategoryUseCase Update(CategoryRepositoryBuilder r) => new(
        LoggedUserBuilder.Build(_user), r.ReadOnly.Object, r.UpdateOnly.Object, UnitOfWorkBuilder.Build());

    private DeleteCategoryUseCase Delete(CategoryRepositoryBuilder r) => new(
        LoggedUserBuilder.Build(_user), r.ReadOnly.Object, r.UpdateOnly.Object, r.WriteOnly.Object, UnitOfWorkBuilder.Build());
}
