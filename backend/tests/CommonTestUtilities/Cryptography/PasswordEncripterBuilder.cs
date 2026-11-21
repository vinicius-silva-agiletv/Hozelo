using Hozelo.Domain.Security.Cryptography;

namespace CommonTestUtilities.Cryptography;

public static class PasswordEncripterBuilder
{
    public static IPasswordEncripter Build() => new FakePasswordEncripter();

    /// <summary>"Hash" previsível e rápido para testes de unidade.</summary>
    private sealed class FakePasswordEncripter : IPasswordEncripter
    {
        public string Encrypt(string password) => $"hashed::{password}";

        public bool IsValid(string password, string passwordHash) => Encrypt(password) == passwordHash;
    }
}
