using System.Net;

namespace Hozelo.Exception.ExceptionsBase;

public class NotFoundException(string message) : HozeloException(message)
{
    public override IList<string> GetErrorMessages() => [Message];

    public override HttpStatusCode GetStatusCode() => HttpStatusCode.NotFound;
}
