using Hozelo.Communication.Responses;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Hozelo.Api.Filters;

public sealed class ExceptionFilter(ILogger<ExceptionFilter> logger) : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is HozeloException hozeloException)
            HandleProjectException(hozeloException, context);
        else
            ThrowUnknownException(context);

        context.ExceptionHandled = true;
    }

    private static void HandleProjectException(HozeloException exception, ExceptionContext context)
    {
        context.HttpContext.Response.StatusCode = (int)exception.GetStatusCode();
        context.Result = new ObjectResult(new ResponseErrorJson(exception.GetErrorMessages()));
    }

    private void ThrowUnknownException(ExceptionContext context)
    {
        logger.LogError(context.Exception, "Erro não tratado");

        context.HttpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Result = new ObjectResult(new ResponseErrorJson(ResourceMessagesException.UNKNOWN_ERROR));
    }
}
