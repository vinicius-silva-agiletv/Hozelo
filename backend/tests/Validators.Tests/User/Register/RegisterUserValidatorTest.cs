using CommonTestUtilities.Requests;
using Hozelo.Application.UseCases.User.Register;
using Hozelo.Communication.Requests;
using Hozelo.Exception;
using Shouldly;

namespace Validators.Tests.User.Register;

public class RegisterUserValidatorTest
{
    private readonly RegisterUserValidator _validator = new();

    [Fact]
    public void Success()
    {
        var result = _validator.Validate(RequestRegisterUserJsonBuilder.Build());

        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public void Success_Password_With_Exactly_8_Characters()
    {
        var result = _validator.Validate(RequestRegisterUserJsonBuilder.Build(passwordLength: 8));

        result.IsValid.ShouldBeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Error_Name_Empty(string name)
    {
        var request = RequestRegisterUserJsonBuilder.Build();
        request.Name = name;

        ShouldFailWith(request, ResourceMessagesException.NAME_EMPTY);
    }

    [Fact]
    public void Error_Name_Too_Long()
    {
        var request = RequestRegisterUserJsonBuilder.Build();
        request.Name = new string('a', 101);

        ShouldFailWith(request, ResourceMessagesException.NAME_TOO_LONG);
    }

    [Fact]
    public void Error_Email_Empty()
    {
        var request = RequestRegisterUserJsonBuilder.Build();
        request.Email = string.Empty;

        ShouldFailWith(request, ResourceMessagesException.EMAIL_EMPTY);
    }

    [Fact]
    public void Error_Email_Invalid()
    {
        var request = RequestRegisterUserJsonBuilder.Build();
        request.Email = "email.invalido";

        ShouldFailWith(request, ResourceMessagesException.EMAIL_INVALID);
    }

    [Fact]
    public void Error_Email_Too_Long()
    {
        var request = RequestRegisterUserJsonBuilder.Build();
        request.Email = new string('a', 250) + "@x.com";

        ShouldFailWith(request, ResourceMessagesException.EMAIL_TOO_LONG);
    }

    [Fact]
    public void Error_Password_Empty()
    {
        var request = RequestRegisterUserJsonBuilder.Build();
        request.Password = string.Empty;

        ShouldFailWith(request, ResourceMessagesException.PASSWORD_EMPTY);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(7)]
    public void Error_Password_Too_Short(int passwordLength)
    {
        var request = RequestRegisterUserJsonBuilder.Build(passwordLength);

        ShouldFailWith(request, ResourceMessagesException.PASSWORD_TOO_SHORT);
    }

    [Fact]
    public void Error_Password_Over_72_Bytes()
    {
        var request = RequestRegisterUserJsonBuilder.Build();
        request.Password = new string('é', 37); // 37 caracteres, 74 bytes em UTF-8

        ShouldFailWith(request, ResourceMessagesException.PASSWORD_TOO_LONG);
    }

    [Fact]
    public void Error_Returns_All_Messages_Together()
    {
        var result = _validator.Validate(new RequestRegisterUserJson());

        result.Errors.Select(e => e.ErrorMessage).ShouldBe(
        [
            ResourceMessagesException.NAME_EMPTY,
            ResourceMessagesException.EMAIL_EMPTY,
            ResourceMessagesException.PASSWORD_EMPTY
        ], ignoreOrder: true);
    }

    private void ShouldFailWith(RequestRegisterUserJson request, string message)
    {
        var result = _validator.Validate(request);

        result.IsValid.ShouldBeFalse();
        result.Errors.Select(e => e.ErrorMessage).ShouldBe([message]);
    }
}
