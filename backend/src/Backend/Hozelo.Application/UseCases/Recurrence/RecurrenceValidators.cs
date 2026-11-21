using FluentValidation;
using Hozelo.Application.UseCases.Income;
using Hozelo.Communication.Requests;
using Hozelo.Domain.Calculations;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.Recurrence;

/// <summary>Regras de data-model.md (RecurringEntry.Name, RecurringEntry.DayOfMonth, RecurringEntry.Notes).</summary>
public class UpdateRecurrenceValidator : AbstractValidator<RequestUpdateRecurrenceJson>
{
    public UpdateRecurrenceValidator()
    {
        RuleFor(r => r.Name)
            .NotEmpty().WithMessage(ResourceMessagesException.NAME_EMPTY)
            .MaximumLength(IncomeValidator.NameMaxLength).WithMessage(ResourceMessagesException.NAME_TOO_LONG);

        RuleFor(r => r.CategoryId)
            .GreaterThan(0).WithMessage(ResourceMessagesException.CATEGORY_REQUIRED);

        RuleFor(r => r.DayOfMonth)
            .InclusiveBetween(1, 31).WithMessage(ResourceMessagesException.DAY_OF_MONTH_INVALID);

        RuleFor(r => r.Notes)
            .MaximumLength(IncomeValidator.NotesMaxLength).WithMessage(ResourceMessagesException.EXPENSE_NOTES_TOO_LONG);

        Person.PersonMarkingRules.Add(this, r => r.PersonId, r => r.PersonPercent);
    }

    public static void Normalize(RequestUpdateRecurrenceJson request)
    {
        request.Name = request.Name?.Trim() ?? string.Empty;
        request.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
    }
}

/// <summary>
/// Cadastro (data-model.md: RecurringEntry.Kind, RecurringEntry.StartMonth, RecurringEntry.EndMonth,
/// RecurringEntryAmount.Amount, além das regras comuns).
/// </summary>
public class RecurrenceValidator : AbstractValidator<RequestRecurrenceJson>
{
    public RecurrenceValidator()
    {
        Include(new UpdateRecurrenceValidator());

        RuleFor(r => r.Kind)
            .Must(k => k.HasValue && Enum.IsDefined(k.Value))
            .WithMessage(ResourceMessagesException.RECURRENCE_KIND_INVALID);

        RuleFor(r => r.Amount).SetValidator(new AmountValidator());

        RuleFor(r => r)
            .Must(r => r.PersonId is null || r.Kind != Communication.Enums.EntryKind.Income)
            .WithName(nameof(RequestRecurrenceJson.PersonId))
            .WithMessage(ResourceMessagesException.RECURRENCE_INCOME_CANNOT_BE_MARKED);

        RuleFor(r => r.StartMonth)
            .Must(YearMonth.IsValid).WithMessage(ResourceMessagesException.MONTH_FORMAT_INVALID);

        RuleFor(r => r.EndMonth)
            .Must(m => string.IsNullOrWhiteSpace(m) || YearMonth.IsValid(m))
            .WithMessage(ResourceMessagesException.MONTH_FORMAT_INVALID);

        RuleFor(r => r)
            .Must(r => YearMonth.Parse(r.EndMonth!) >= YearMonth.Parse(r.StartMonth))
            .When(r => YearMonth.IsValid(r.StartMonth) && YearMonth.IsValid(r.EndMonth))
            .WithName(nameof(RequestRecurrenceJson.EndMonth))
            .WithMessage(ResourceMessagesException.END_BEFORE_START);
    }
}

/// <summary>Valor dali em diante (data-model.md, RecurringEntryAmount.EffectiveMonth e RecurringEntryAmount.Amount).</summary>
public class ChangeRecurrenceAmountValidator : AbstractValidator<RequestChangeRecurrenceAmountJson>
{
    public ChangeRecurrenceAmountValidator()
    {
        RuleFor(r => r.Amount).SetValidator(new AmountValidator());

        RuleFor(r => r.FromMonth)
            .Must(YearMonth.IsValid).WithMessage(ResourceMessagesException.MONTH_FORMAT_INVALID);
    }
}

/// <summary>Ajuste ou pulo de um mês (data-model.md, RecurringEntryMonth.Amount e RecurringEntryMonth.Skipped).</summary>
public class AdjustRecurrenceMonthValidator : AbstractValidator<RequestAdjustRecurrenceMonthJson>
{
    public AdjustRecurrenceMonthValidator()
    {
        RuleFor(r => r)
            .Must(r => r.Skipped || r.Amount.HasValue)
            .WithName(nameof(RequestAdjustRecurrenceMonthJson.Amount))
            .WithMessage(ResourceMessagesException.MONTH_ADJUSTMENT_EMPTY);

        When(r => !r.Skipped && r.Amount.HasValue, () =>
        {
            RuleFor(r => r.Amount!.Value).SetValidator(new AmountValidator()).OverridePropertyName("Amount");
        });
    }
}
