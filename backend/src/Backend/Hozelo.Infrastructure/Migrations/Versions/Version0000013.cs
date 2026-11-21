using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.CreateTablesPersonPayments, "Cria as tabelas de pagamentos de terceiros")]
public class Version0000013 : VersionBase
{
    public override void Up()
    {
        CreateTable("person_payments")
            .WithColumn("user_id").AsInt64().NotNullable()
                .ForeignKey("fk_person_payments_users", "users", "id")
            .WithColumn("person_id").AsInt64().NotNullable()
                .ForeignKey("fk_person_payments_people", "people", "id").Indexed("ix_person_payments_person_id")
            .WithColumn("amount").AsDecimal(12, 2).NotNullable()
            .WithColumn("paid_on").AsDate().NotNullable()
            .WithColumn("notes").AsString(500).Nullable();

        Create.Table("person_payment_targets")
            .WithColumn("id").AsInt64().PrimaryKey().Identity()
            .WithColumn("person_payment_id").AsInt64().NotNullable()
            .WithColumn("charge_key").AsString(80).NotNullable()
            .WithColumn("position").AsInt32().NotNullable();

        Execute.Sql(
            """
            ALTER TABLE person_payments ADD CONSTRAINT ck_person_payments_amount CHECK (amount > 0);
            ALTER TABLE person_payment_targets
                ADD CONSTRAINT fk_person_payment_targets_payments FOREIGN KEY (person_payment_id)
                    REFERENCES person_payments (id) ON DELETE CASCADE,
                ADD CONSTRAINT ux_person_payment_targets_key UNIQUE (person_payment_id, charge_key);
            """);
    }
}
