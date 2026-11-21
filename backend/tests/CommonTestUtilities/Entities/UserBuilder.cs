using Bogus;
using CommonTestUtilities.Cryptography;
using Hozelo.Domain.Entities;

namespace CommonTestUtilities.Entities;

public static class UserBuilder
{
    /// <summary>Usuário com senha "hasheada" pelo encripter fake, junto da senha em texto.</summary>
    public static (User user, string password) Build()
    {
        var password = new Faker().Internet.Password(10);
        var encripter = PasswordEncripterBuilder.Build();

        var user = new Faker<User>()
            .RuleFor(u => u.Id, _ => 1)
            .RuleFor(u => u.UserIdentifier, _ => Guid.NewGuid())
            .RuleFor(u => u.Name, f => f.Person.FullName)
            .RuleFor(u => u.Email, (f, u) => f.Internet.Email(u.Name).ToLowerInvariant())
            .RuleFor(u => u.Password, _ => encripter.Encrypt(password))
            .Generate();

        return (user, password);
    }
}
