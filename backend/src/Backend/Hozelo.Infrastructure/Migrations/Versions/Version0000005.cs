using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.CreateTableExpenseInstallments, "Cria a tabela de parcelas das despesas")]
public class Version0000005 : ForwardOnlyMigration
{
    public override void Up()
    {
        Create.Table("expense_installments")
            .WithColumn("id").AsInt64().PrimaryKey().Identity()
            .WithColumn("expense_id").AsInt64().NotNullable()
            .WithColumn("number").AsInt32().NotNullable()
            .WithColumn("due_date").AsDate().NotNullable().Indexed("ix_expense_installments_due_date")
            .WithColumn("amount").AsDecimal(12, 2).NotNullable()
            .WithColumn("paid_on").AsDate().Nullable().Indexed("ix_expense_installments_paid_on")
            .WithColumn("paid_amount").AsDecimal(12, 2).Nullable()
            .WithColumn("prepaid").AsBoolean().NotNullable().WithDefaultValue(false);

        Create.Index("ux_expense_installments_expense_number").OnTable("expense_installments")
            .OnColumn("expense_id").Ascending()
            .OnColumn("number").Ascending()
            .WithOptions().Unique();

        // Parcelas somem junto com a despesa (research.md §10); pagamento sempre consistente.
        Execute.Sql(
            """
            ALTER TABLE expense_installments
                ADD CONSTRAINT fk_expense_installments_expenses FOREIGN KEY (expense_id)
                    REFERENCES expenses (id) ON DELETE CASCADE,
                ADD CONSTRAINT ck_expense_installments_number CHECK (number >= 1),
                ADD CONSTRAINT ck_expense_installments_amount CHECK (amount > 0),
                ADD CONSTRAINT ck_expense_installments_payment CHECK ((paid_on IS NULL) = (paid_amount IS NULL)),
                ADD CONSTRAINT ck_expense_installments_paid_amount CHECK (paid_amount > 0 AND paid_amount <= amount),
                ADD CONSTRAINT ck_expense_installments_prepaid CHECK (NOT prepaid OR paid_on IS NOT NULL);
            """);
    }
}
