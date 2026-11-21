using System.Net;

namespace Hozelo.Exception.ExceptionsBase;

public class InvalidLoginException() : HozeloException(ResourceMessagesException.EMAIL_OR_PASSWORD_INVALID)
{
    public override IList<string> GetErrorMessages() => [Message];

    public override HttpStatusCode GetStatusCode() => HttpStatusCode.Unauthorized;
}
