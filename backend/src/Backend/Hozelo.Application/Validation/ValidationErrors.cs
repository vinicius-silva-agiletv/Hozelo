using FluentValidation.Results;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.Validation;

public static class ValidationErrors
{
    /// <summary>Lança <see cref="ErrorOnValidationException"/> com todas as mensagens, se houver alguma.</summary>
    public static void ThrowIfAny(IList<string> errors)
    {
        if (errors.Count > 0)
            throw new ErrorOnValidationException(errors);
    }

    public static List<string> Messages(this ValidationResult result) =>
        result.Errors.Select(e => e.ErrorMessage).ToList();
}
