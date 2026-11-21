using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.CreateTableOpeningBalances, "Cria a tabela do saldo inicial da família")]
public class Version0000009 : ForwardOnlyMigration
{
    public override void Up()
    {
        Create.Table("opening_balances")
            .WithColumn("id").AsInt64().PrimaryKey().Identity()
            .WithColumn("user_id").AsInt64().NotNullable()
                .ForeignKey("fk_opening_balances_users", "users", "id")
                .Unique("ux_opening_balances_user_id")
            .WithColumn("amount").AsDecimal(12, 2).NotNullable()
            .WithColumn("reference_date").AsDate().NotNullable()
            .WithColumn("updated_on").AsCustom("timestamptz").NotNullable();
    }
}
