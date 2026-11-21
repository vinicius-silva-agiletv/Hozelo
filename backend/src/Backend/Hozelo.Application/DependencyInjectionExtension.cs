using Hozelo.Application.Settings;
using Hozelo.Application.UseCases.Login.DoLogin;
using Hozelo.Application.UseCases.User.Register;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Hozelo.Application;

public static class DependencyInjectionExtension
{
    public static void AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        AddSettings(services, configuration);
        AddUseCases(services);
    }

    private static void AddSettings(IServiceCollection services, IConfiguration configuration)
    {
        var lockout = configuration.GetSection(LoginLockoutSettings.Section).Get<LoginLockoutSettings>()
            ?? new LoginLockoutSettings();

        services.AddSingleton(lockout);
    }

    private static void AddUseCases(IServiceCollection services)
    {
        services.AddScoped<IRegisterUserUseCase, RegisterUserUseCase>();
        services.AddScoped<IDoLoginUseCase, DoLoginUseCase>();
    }
}
