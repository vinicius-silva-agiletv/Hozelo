using Dapper;
using FluentMigrator.Runner;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Hozelo.Infrastructure.Migrations;

public static class DatabaseMigration
{
    public static void Migrate(string connectionString, IServiceProvider serviceProvider)
    {
        EnsureDatabaseCreated(connectionString);
        MigrateDatabase(serviceProvider);
    }

    // FluentMigrator não cria o banco, só as tabelas (research.md §5).
    private static void EnsureDatabaseCreated(string connectionString)
    {
        var builder = new NpgsqlConnectionStringBuilder(connectionString);
        var databaseName = builder.Database
            ?? throw new InvalidOperationException("A connection string não informa o banco de dados.");

        builder.Database = "postgres";

        using var connection = new NpgsqlConnection(builder.ConnectionString);

        var exists = connection.ExecuteScalar<bool>(
            "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = @name)",
            new { name = databaseName });

        if (exists)
            return;

        var quotedName = "\"" + databaseName.Replace("\"", "\"\"") + "\"";
        connection.Execute($"CREATE DATABASE {quotedName}");
    }

    private static void MigrateDatabase(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var runner = scope.ServiceProvider.GetRequiredService<IMigrationRunner>();

        runner.ListMigrations();
        runner.MigrateUp();
    }
}
