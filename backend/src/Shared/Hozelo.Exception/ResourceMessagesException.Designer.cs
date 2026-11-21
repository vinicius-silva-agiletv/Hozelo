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
}
