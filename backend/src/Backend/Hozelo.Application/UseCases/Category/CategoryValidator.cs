using FluentValidation;
using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.Category;

/// <summary>Regras de data-model.md (Category.Name). O nome chega já sem espaços nas pontas.</summary>
public class CategoryValidator : AbstractValidator<RequestCategoryJson>
{
    public const int NameMaxLength = 50;

    public CategoryValidator()
    {
        RuleFor(r => r.Name)
            .NotEmpty().WithMessage(ResourceMessagesException.CATEGORY_NAME_EMPTY)
            .MaximumLength(NameMaxLength).WithMessage(ResourceMessagesException.CATEGORY_NAME_TOO_LONG);

        RuleFor(r => r.Type)
            .Must(t => t is null || Enum.IsDefined(t.Value))
            .WithMessage(ResourceMessagesException.CATEGORY_TYPE_INVALID);
    }

    /// <summary>Remove espaços das pontas e valida, lançando todos os erros juntos.</summary>
    public static void NormalizeAndValidate(RequestCategoryJson request)
    {
        request.Name = request.Name?.Trim() ?? string.Empty;
        ValidationErrors.ThrowIfAny(new CategoryValidator().Validate(request).Messages());
    }
}
