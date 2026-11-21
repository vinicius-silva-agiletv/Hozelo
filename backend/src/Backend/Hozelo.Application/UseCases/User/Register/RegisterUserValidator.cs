using System.Text;
using FluentValidation;
using Hozelo.Communication.Requests;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.User.Register;

/// <summary>Regras de data-model.md (User.Name, User.Email, User.Password).</summary>
public class RegisterUserValidator : AbstractValidator<RequestRegisterUserJson>
{
    private const int NameMaxLength = 100;
    private const int EmailMaxLength = 255;
    private const int PasswordMinLength = 8;
    // BCrypt só considera os primeiros 72 bytes da senha (research.md §1).
    private const int PasswordMaxBytes = 72;

    public RegisterUserValidator()
    {
        RuleFor(r => r.Name)
            .NotEmpty().WithMessage(ResourceMessagesException.NAME_EMPTY)
            .MaximumLength(NameMaxLength).WithMessage(ResourceMessagesException.NAME_TOO_LONG);

        RuleFor(r => r.Email)
            .NotEmpty().WithMessage(ResourceMessagesException.EMAIL_EMPTY);

        When(r => !string.IsNullOrWhiteSpace(r.Email), () =>
        {
            RuleFor(r => r.Email)
                .EmailAddress().WithMessage(ResourceMessagesException.EMAIL_INVALID)
                .MaximumLength(EmailMaxLength).WithMessage(ResourceMessagesException.EMAIL_TOO_LONG);
        });

        RuleFor(r => r.Password)
            .NotEmpty().WithMessage(ResourceMessagesException.PASSWORD_EMPTY);

        When(r => !string.IsNullOrEmpty(r.Password), () =>
        {
            RuleFor(r => r.Password)
                .MinimumLength(PasswordMinLength).WithMessage(ResourceMessagesException.PASSWORD_TOO_SHORT)
                .Must(p => Encoding.UTF8.GetByteCount(p) <= PasswordMaxBytes)
                .WithMessage(ResourceMessagesException.PASSWORD_TOO_LONG);
        });
    }
}
