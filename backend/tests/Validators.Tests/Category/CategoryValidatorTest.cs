using CommonTestUtilities.Requests;
using Hozelo.Application.UseCases.Category;
using Hozelo.Exception;
using Shouldly;

namespace Validators.Tests.Category;

public class CategoryValidatorTest
{
    [Fact]
    public void Success()
    {
        new CategoryValidator().Validate(RequestCategoryJsonBuilder.Build()).IsValid.ShouldBeTrue();
    }

    [Fact]
    public void Success_Name_With_50_Characters()
    {
        new CategoryValidator().Validate(RequestCategoryJsonBuilder.Build(new string('a', 50))).IsValid.ShouldBeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Error_Name_Empty(string? name)
    {
        var result = new CategoryValidator().Validate(new Hozelo.Communication.Requests.RequestCategoryJson { Name = name! });

        result.Errors.Select(e => e.ErrorMessage).ShouldBe([ResourceMessagesException.CATEGORY_NAME_EMPTY]);
    }

    [Fact]
    public void Error_Name_Too_Long()
    {
        var result = new CategoryValidator().Validate(RequestCategoryJsonBuilder.Build(new string('a', 51)));

        result.Errors.Select(e => e.ErrorMessage).ShouldBe([ResourceMessagesException.CATEGORY_NAME_TOO_LONG]);
    }
}
