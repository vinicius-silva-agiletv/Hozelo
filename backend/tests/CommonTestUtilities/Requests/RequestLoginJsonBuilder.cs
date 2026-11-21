using Hozelo.Communication.Requests;

namespace CommonTestUtilities.Requests;

public static class RequestLoginJsonBuilder
{
    public static RequestLoginJson Build(string email, string password) => new() { Email = email, Password = password };
}
