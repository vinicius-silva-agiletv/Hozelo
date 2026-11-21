using System.Net;

namespace Hozelo.Exception.ExceptionsBase;

public class TooManyLoginAttemptsException() : HozeloException(ResourceMessagesException.TOO_MANY_LOGIN_ATTEMPTS)
{
    public override IList<string> GetErrorMessages() => [Message];

    public override HttpStatusCode GetStatusCode() => HttpStatusCode.TooManyRequests;
}
