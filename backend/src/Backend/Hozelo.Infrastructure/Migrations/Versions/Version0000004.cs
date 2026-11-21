using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.CreateTableExpenses, "Cria a tabela de despesas")]
public class Version0000004 : VersionBase
{
    public override void Up()
    {
        CreateTable("expenses")
            .WithColumn("user_id").AsInt64().NotNullable()
                .ForeignKey("fk_expenses_users", "users", "id").Indexed("ix_expenses_user_id")
            .WithColumn("category_id").AsInt64().NotNullable().Indexed("ix_expenses_category_id")
            .WithColumn("name").AsString(100).NotNullable()
            .WithColumn("amount_type").AsInt16().NotNullable()
            .WithColumn("total_amount").AsDecimal(12, 2).NotNullable()
            .WithColumn("installment_amount").AsDecimal(12, 2).NotNullable()
            .WithColumn("installments_count").AsInt32().NotNullable()
            .WithColumn("first_due_date").AsDate().NotNullable()
            .WithColumn("notes").AsString(500).Nullable();

        // ON DELETE RESTRICT: categoria com despesas não pode ser removida (research.md §9).
        Execute.Sql(
            """
            ALTER TABLE expenses
                ADD CONSTRAINT fk_expenses_categories FOREIGN KEY (category_id)
                    REFERENCES categories (id) ON DELETE RESTRICT,
                ADD CONSTRAINT ck_expenses_total_amount CHECK (total_amount > 0),
                ADD CONSTRAINT ck_expenses_installment_amount CHECK (installment_amount > 0),
                ADD CONSTRAINT ck_expenses_installments_count CHECK (installments_count BETWEEN 1 AND 480),
                ADD CONSTRAINT ck_expenses_amount_type CHECK (amount_type IN (1, 2));
            """);
    }
}
