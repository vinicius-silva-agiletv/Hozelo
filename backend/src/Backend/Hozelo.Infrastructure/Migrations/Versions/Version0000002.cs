using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.CreateTableLoginThrottle, "Cria o controle global de tentativas de login")]
public class Version0000002 : ForwardOnlyMigration
{
    public override void Up()
    {
        Create.Table("login_throttle")
            .WithColumn("id").AsInt32().PrimaryKey()
            .WithColumn("failed_attempts").AsInt32().NotNullable().WithDefaultValue(0)
            .WithColumn("locked_until_utc").AsCustom("timestamptz").Nullable();

        Execute.Sql("ALTER TABLE login_throttle ADD CONSTRAINT ck_login_throttle_single_row CHECK (id = 1);");
        Execute.Sql("ALTER TABLE login_throttle ADD CONSTRAINT ck_login_throttle_attempts CHECK (failed_attempts >= 0);");

        Insert.IntoTable("login_throttle").Row(new { id = 1, failed_attempts = 0 });
    }
}
