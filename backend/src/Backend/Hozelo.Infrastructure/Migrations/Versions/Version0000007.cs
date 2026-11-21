using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.CreateTableIncomes, "Cria a tabela de receitas avulsas")]
public class Version0000007 : VersionBase
{
    public override void Up()
    {
        CreateTable("incomes")
            .WithColumn("user_id").AsInt64().NotNullable()
                .ForeignKey("fk_incomes_users", "users", "id").Indexed("ix_incomes_user_id")
            .WithColumn("category_id").AsInt64().NotNullable().Indexed("ix_incomes_category_id")
            .WithColumn("name").AsString(100).NotNullable()
            .WithColumn("amount").AsDecimal(12, 2).NotNullable()
            .WithColumn("expected_date").AsDate().NotNullable().Indexed("ix_incomes_expected_date")
            .WithColumn("received_on").AsDate().Nullable()
            .WithColumn("notes").AsString(500).Nullable();

        Execute.Sql(
            """
            ALTER TABLE incomes
                ADD CONSTRAINT fk_incomes_categories FOREIGN KEY (category_id)
                    REFERENCES categories (id) ON DELETE RESTRICT,
                ADD CONSTRAINT ck_incomes_amount CHECK (amount > 0);
            """);
    }
}
