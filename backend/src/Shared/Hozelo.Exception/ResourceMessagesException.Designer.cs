// Acesso fortemente tipado às mensagens de ResourceMessagesException.resx.
#nullable enable
using System.Globalization;
using System.Resources;

namespace Hozelo.Exception;

public static class ResourceMessagesException
{
    private static ResourceManager? _resourceManager;

    public static ResourceManager ResourceManager =>
        _resourceManager ??= new ResourceManager(
            "Hozelo.Exception.ResourceMessagesException",
            typeof(ResourceMessagesException).Assembly);

    public static CultureInfo? Culture { get; set; }

    public static string NAME_EMPTY => ResourceManager.GetString("NAME_EMPTY", Culture)!;

    public static string NAME_TOO_LONG => ResourceManager.GetString("NAME_TOO_LONG", Culture)!;

    public static string EMAIL_EMPTY => ResourceManager.GetString("EMAIL_EMPTY", Culture)!;

    public static string EMAIL_INVALID => ResourceManager.GetString("EMAIL_INVALID", Culture)!;

    public static string EMAIL_TOO_LONG => ResourceManager.GetString("EMAIL_TOO_LONG", Culture)!;

    public static string PASSWORD_EMPTY => ResourceManager.GetString("PASSWORD_EMPTY", Culture)!;

    public static string PASSWORD_TOO_SHORT => ResourceManager.GetString("PASSWORD_TOO_SHORT", Culture)!;

    public static string PASSWORD_TOO_LONG => ResourceManager.GetString("PASSWORD_TOO_LONG", Culture)!;

    public static string ACCOUNT_ALREADY_EXISTS => ResourceManager.GetString("ACCOUNT_ALREADY_EXISTS", Culture)!;

    public static string EMAIL_OR_PASSWORD_INVALID => ResourceManager.GetString("EMAIL_OR_PASSWORD_INVALID", Culture)!;

    public static string TOO_MANY_LOGIN_ATTEMPTS => ResourceManager.GetString("TOO_MANY_LOGIN_ATTEMPTS", Culture)!;

    public static string NO_TOKEN => ResourceManager.GetString("NO_TOKEN", Culture)!;

    public static string INVALID_SESSION => ResourceManager.GetString("INVALID_SESSION", Culture)!;

    public static string UNKNOWN_ERROR => ResourceManager.GetString("UNKNOWN_ERROR", Culture)!;

    public static string CATEGORY_NAME_EMPTY => ResourceManager.GetString("CATEGORY_NAME_EMPTY", Culture)!;

    public static string CATEGORY_NAME_TOO_LONG => ResourceManager.GetString("CATEGORY_NAME_TOO_LONG", Culture)!;

    public static string CATEGORY_NAME_ALREADY_EXISTS => ResourceManager.GetString("CATEGORY_NAME_ALREADY_EXISTS", Culture)!;

    public static string CATEGORY_HAS_EXPENSES => ResourceManager.GetString("CATEGORY_HAS_EXPENSES", Culture)!;

    public static string CATEGORY_NOT_FOUND => ResourceManager.GetString("CATEGORY_NOT_FOUND", Culture)!;

    public static string EXPENSE_NAME_EMPTY => ResourceManager.GetString("EXPENSE_NAME_EMPTY", Culture)!;

    public static string EXPENSE_NAME_TOO_LONG => ResourceManager.GetString("EXPENSE_NAME_TOO_LONG", Culture)!;

    public static string EXPENSE_CATEGORY_EMPTY => ResourceManager.GetString("EXPENSE_CATEGORY_EMPTY", Culture)!;

    public static string EXPENSE_CATEGORY_NOT_EXISTS => ResourceManager.GetString("EXPENSE_CATEGORY_NOT_EXISTS", Culture)!;

    public static string EXPENSE_AMOUNT_TYPE_INVALID => ResourceManager.GetString("EXPENSE_AMOUNT_TYPE_INVALID", Culture)!;

    public static string AMOUNT_MUST_BE_POSITIVE => ResourceManager.GetString("AMOUNT_MUST_BE_POSITIVE", Culture)!;

    public static string AMOUNT_TOO_MANY_DECIMALS => ResourceManager.GetString("AMOUNT_TOO_MANY_DECIMALS", Culture)!;

    public static string EXPENSE_TOTAL_TOO_HIGH => ResourceManager.GetString("EXPENSE_TOTAL_TOO_HIGH", Culture)!;

    public static string SINGLE_PAYMENT_MUST_HAVE_ONE_INSTALLMENT => ResourceManager.GetString("SINGLE_PAYMENT_MUST_HAVE_ONE_INSTALLMENT", Culture)!;

    public static string INSTALLMENTS_COUNT_OUT_OF_RANGE => ResourceManager.GetString("INSTALLMENTS_COUNT_OUT_OF_RANGE", Culture)!;

    public static string FIRST_DUE_DATE_EMPTY => ResourceManager.GetString("FIRST_DUE_DATE_EMPTY", Culture)!;

    public static string ALREADY_PAID_INSTALLMENTS_OUT_OF_RANGE => ResourceManager.GetString("ALREADY_PAID_INSTALLMENTS_OUT_OF_RANGE", Culture)!;

    public static string TOTAL_TOO_SMALL_FOR_INSTALLMENTS => ResourceManager.GetString("TOTAL_TOO_SMALL_FOR_INSTALLMENTS", Culture)!;

    public static string EXPENSE_NOTES_TOO_LONG => ResourceManager.GetString("EXPENSE_NOTES_TOO_LONG", Culture)!;

    public static string EXPENSE_NOT_FOUND => ResourceManager.GetString("EXPENSE_NOT_FOUND", Culture)!;

    public static string INSTALLMENT_NOT_FOUND => ResourceManager.GetString("INSTALLMENT_NOT_FOUND", Culture)!;

    public static string PAID_INSTALLMENTS_EXCEED_COUNT => ResourceManager.GetString("PAID_INSTALLMENTS_EXCEED_COUNT", Culture)!;

    public static string UNDO_PREPAYMENTS_BEFORE_RESCHEDULE => ResourceManager.GetString("UNDO_PREPAYMENTS_BEFORE_RESCHEDULE", Culture)!;

    public static string PAID_ON_IN_FUTURE => ResourceManager.GetString("PAID_ON_IN_FUTURE", Culture)!;

    public static string AMORTIZATION_SELECTION_REQUIRED => ResourceManager.GetString("AMORTIZATION_SELECTION_REQUIRED", Culture)!;

    public static string AMORTIZATION_QUANTITY_INVALID => ResourceManager.GetString("AMORTIZATION_QUANTITY_INVALID", Culture)!;

    public static string AMORTIZATION_INSTALLMENTS_INVALID => ResourceManager.GetString("AMORTIZATION_INSTALLMENTS_INVALID", Culture)!;

    public static string PAID_AMOUNT_INVALID => ResourceManager.GetString("PAID_AMOUNT_INVALID", Culture)!;

    public static string PAID_AMOUNT_EXCEEDS_SELECTED => ResourceManager.GetString("PAID_AMOUNT_EXCEEDS_SELECTED", Culture)!;

    public static string PAID_AMOUNT_TOO_SMALL => ResourceManager.GetString("PAID_AMOUNT_TOO_SMALL", Culture)!;

    public static string EXPENSE_STATUS_INVALID => ResourceManager.GetString("EXPENSE_STATUS_INVALID", Culture)!;

    public static string MONTH_INVALID => ResourceManager.GetString("MONTH_INVALID", Culture)!;

    public static string CATEGORY_HAS_ENTRIES => ResourceManager.GetString("CATEGORY_HAS_ENTRIES", Culture)!;

    public static string CATEGORY_TYPE_IMMUTABLE => ResourceManager.GetString("CATEGORY_TYPE_IMMUTABLE", Culture)!;

    public static string CATEGORY_TYPE_INVALID => ResourceManager.GetString("CATEGORY_TYPE_INVALID", Culture)!;

    public static string CATEGORY_REQUIRED => ResourceManager.GetString("CATEGORY_REQUIRED", Culture)!;

    public static string CATEGORY_NOT_INCOME => ResourceManager.GetString("CATEGORY_NOT_INCOME", Culture)!;

    public static string CATEGORY_NOT_EXPENSE => ResourceManager.GetString("CATEGORY_NOT_EXPENSE", Culture)!;

    public static string AMOUNT_TOO_HIGH => ResourceManager.GetString("AMOUNT_TOO_HIGH", Culture)!;

    public static string EXPECTED_DATE_EMPTY => ResourceManager.GetString("EXPECTED_DATE_EMPTY", Culture)!;

    public static string DATE_IN_FUTURE => ResourceManager.GetString("DATE_IN_FUTURE", Culture)!;

    public static string RECURRENCE_KIND_INVALID => ResourceManager.GetString("RECURRENCE_KIND_INVALID", Culture)!;

    public static string DAY_OF_MONTH_INVALID => ResourceManager.GetString("DAY_OF_MONTH_INVALID", Culture)!;

    public static string MONTH_FORMAT_INVALID => ResourceManager.GetString("MONTH_FORMAT_INVALID", Culture)!;

    public static string END_BEFORE_START => ResourceManager.GetString("END_BEFORE_START", Culture)!;

    public static string MONTH_OUT_OF_PERIOD => ResourceManager.GetString("MONTH_OUT_OF_PERIOD", Culture)!;

    public static string UNDO_SETTLEMENT_BEFORE_SKIP => ResourceManager.GetString("UNDO_SETTLEMENT_BEFORE_SKIP", Culture)!;

    public static string MONTH_SKIPPED => ResourceManager.GetString("MONTH_SKIPPED", Culture)!;

    public static string SETTLED_AFTER_END => ResourceManager.GetString("SETTLED_AFTER_END", Culture)!;

    public static string MONTH_ADJUSTMENT_EMPTY => ResourceManager.GetString("MONTH_ADJUSTMENT_EMPTY", Culture)!;

    public static string OPENING_DATE_EMPTY => ResourceManager.GetString("OPENING_DATE_EMPTY", Culture)!;

    public static string OPENING_BALANCE_NOT_FOUND => ResourceManager.GetString("OPENING_BALANCE_NOT_FOUND", Culture)!;

    public static string INCOME_NOT_FOUND => ResourceManager.GetString("INCOME_NOT_FOUND", Culture)!;

    public static string RECURRENCE_NOT_FOUND => ResourceManager.GetString("RECURRENCE_NOT_FOUND", Culture)!;
}
