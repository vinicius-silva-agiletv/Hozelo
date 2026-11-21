using FluentMigrator.Runner;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.LoginThrottle;
using Hozelo.Domain.Repositories.User;
using Hozelo.Domain.Security.Cryptography;
using Hozelo.Domain.Security.Tokens;
using Hozelo.Infrastructure.DataAccess;
using Hozelo.Infrastructure.DataAccess.Repositories;
using Hozelo.Infrastructure.Migrations;
using Hozelo.Infrastructure.Security.Cryptography;
using Hozelo.Infrastructure.Security.Tokens;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Hozelo.Infrastructure;

public static class DependencyInjectionExtension
{
    public static void AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.ConnectionString();

        services.TryAddSingleton(TimeProvider.System);

        AddDbContext(services, connectionString);
        AddFluentMigrator(services, connectionString);
        AddRepositories(services);
        AddSecurity(services, configuration);
    }

    public static string ConnectionString(this IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Connection");

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                "ConnectionStrings:Connection não configurada. Defina via user-secrets ou variável de ambiente.");

        return connectionString;
    }

    private static void AddDbContext(IServiceCollection services, string connectionString)
    {
        services.AddDbContext<HozeloDbContext>(options => options.UseNpgsql(connectionString));
    }

    private static void AddFluentMigrator(IServiceCollection services, string connectionString)
    {
        services.AddFluentMigratorCore().ConfigureRunner(runner => runner
            .AddPostgres()
            .WithGlobalConnectionString(connectionString)
            .ScanIn(typeof(DatabaseMigration).Assembly).For.Migrations());
    }

    private static void AddRepositories(IServiceCollection services)
    {
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<UserRepository>();
        services.AddScoped<IUserReadOnlyRepository>(sp => sp.GetRequiredService<UserRepository>());
        services.AddScoped<IUserWriteOnlyRepository>(sp => sp.GetRequiredService<UserRepository>());

        services.AddScoped<ILoginThrottleRepository, LoginThrottleRepository>();
    }

    private static void AddSecurity(IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection(JwtSettings.Section).Get<JwtSettings>() ?? new JwtSettings();
        jwtSettings.Validate(); // falha na inicialização se a chave estiver ausente ou curta

        services.AddSingleton(jwtSettings);
        services.AddScoped<IAccessTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IPasswordEncripter, BCryptNet>();
    }
}
