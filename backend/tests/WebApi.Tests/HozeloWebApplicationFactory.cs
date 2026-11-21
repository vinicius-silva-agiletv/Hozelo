using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Time.Testing;
using Npgsql;
using Testcontainers.PostgreSql;

namespace WebApi.Tests;

/// <summary>
/// Sobe a API contra um PostgreSQL descartável (Testcontainers), rodando as migrations reais.
/// </summary>
public class HozeloWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string SigningKey = "chave-de-teste-do-hozelo-com-mais-de-32-caracteres";

    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:17").Build();

    private string _connectionString = string.Empty;

    public FakeTimeProvider TimeProvider { get; } = new(DateTimeOffset.UtcNow);

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        var builder = new NpgsqlConnectionStringBuilder(_container.GetConnectionString())
        {
            Database = "hozelo_tests"
        };
        _connectionString = builder.ConnectionString;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");
        builder.UseSetting("ConnectionStrings:Connection", _connectionString);
        builder.UseSetting("Settings:Jwt:SigningKey", SigningKey);

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<TimeProvider>();
            services.AddSingleton<TimeProvider>(TimeProvider);
        });
    }

    /// <summary>Remove a conta (e, em cascata, categorias, despesas e parcelas) e zera o controle de tentativas.</summary>
    public async Task ResetDatabaseAsync()
    {
        _ = Server; // garante que a API subiu e as migrations rodaram

        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            """
            TRUNCATE TABLE users RESTART IDENTITY CASCADE;
            DO $$
            BEGIN
                IF to_regclass('login_throttle') IS NOT NULL THEN
                    UPDATE login_throttle SET failed_attempts = 0, locked_until_utc = NULL;
                END IF;
            END $$;
            """,
            connection);

        await command.ExecuteNonQueryAsync();
    }

    public async Task<T> ExecuteScalarAsync<T>(string sql)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        return (T)(await command.ExecuteScalarAsync())!;
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
        await _container.DisposeAsync();
    }
}

[CollectionDefinition(Name)]
public class WebApiCollection : ICollectionFixture<HozeloWebApplicationFactory>
{
    public const string Name = "WebApi";
}
