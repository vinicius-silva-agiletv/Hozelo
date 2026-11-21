using System.Net;

namespace Hozelo.Exception.ExceptionsBase;

public abstract class HozeloException(string message) : SystemException(message)
{
    public abstract IList<string> GetErrorMessages();

    public abstract HttpStatusCode GetStatusCode();
}
