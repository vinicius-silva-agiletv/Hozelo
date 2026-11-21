using Bogus;
using Hozelo.Communication.Requests;

namespace CommonTestUtilities.Requests;

public static class RequestRegisterUserJsonBuilder
{
    public static RequestRegisterUserJson Build(int passwordLength = 10)
    {
        return new Faker<RequestRegisterUserJson>()
            .RuleFor(r => r.Name, f => f.Person.FullName)
            .RuleFor(r => r.Email, (f, r) => f.Internet.Email(r.Name).ToLowerInvariant())
            .RuleFor(r => r.Password, f => f.Internet.Password(passwordLength));
    }
}
