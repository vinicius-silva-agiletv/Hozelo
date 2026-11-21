using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.CreateTableUsers, "Cria a tabela de usuários (conta única da família)")]
public class Version0000001 : VersionBase
{
    public override void Up()
    {
        CreateTable("users")
            .WithColumn("user_identifier").AsGuid().NotNullable()
            .WithColumn("name").AsString(100).NotNullable()
            .WithColumn("email").AsString(255).NotNullable()
            .WithColumn("password").AsString(255).NotNullable();

        Create.Index("ux_users_user_identifier").OnTable("users")
            .OnColumn("user_identifier").Ascending().WithOptions().Unique();

        Create.Index("ux_users_email").OnTable("users")
            .OnColumn("email").Ascending().WithOptions().Unique();

        // Índice único sobre expressão constante: o banco nunca aceita uma segunda conta.
        Execute.Sql("CREATE UNIQUE INDEX ux_users_single_account ON users ((true));");
    }
}
