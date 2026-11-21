using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.CreateTablePersonCharges, "Cria a tabela de cobranças avulsas de terceiros")]
public class Version0000012 : VersionBase
{
    public override void Up()
    {
        CreateTable("person_charges")
            .WithColumn("user_id").AsInt64().NotNullable()
                .ForeignKey("fk_person_charges_users", "users", "id")
            .WithColumn("person_id").AsInt64().NotNullable()
                .ForeignKey("fk_person_charges_people", "people", "id").Indexed("ix_person_charges_person_id")
            .WithColumn("description").AsString(100).NotNullable()
            .WithColumn("amount").AsDecimal(12, 2).NotNullable()
            .WithColumn("charge_date").AsDate().NotNullable()
            .WithColumn("notes").AsString(500).Nullable();

        Execute.Sql("ALTER TABLE person_charges ADD CONSTRAINT ck_person_charges_amount CHECK (amount > 0);");
    }
}
