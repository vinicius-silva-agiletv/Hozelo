using System.Net;

namespace Hozelo.Exception.ExceptionsBase;

public class AccountAlreadyExistsException() : HozeloException(ResourceMessagesException.ACCOUNT_ALREADY_EXISTS)
{
    public override IList<string> GetErrorMessages() => [Message];

    public override HttpStatusCode GetStatusCode() => HttpStatusCode.Conflict;
}
