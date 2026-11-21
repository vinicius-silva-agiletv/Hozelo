using System.Net;

namespace Hozelo.Exception.ExceptionsBase;

public class ErrorOnValidationException(IList<string> errorMessages) : HozeloException(string.Empty)
{
    private readonly IList<string> _errorMessages = errorMessages;

    public override IList<string> GetErrorMessages() => _errorMessages;

    public override HttpStatusCode GetStatusCode() => HttpStatusCode.BadRequest;
}
