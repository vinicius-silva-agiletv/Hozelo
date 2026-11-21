using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.CreateTablesRecurrences, "Cria as tabelas de receitas recorrentes e contas fixas")]
public class Version0000008 : VersionBase
{
    public override void Up()
    {
        CreateTable("recurring_entries")
            .WithColumn("user_id").AsInt64().NotNullable()
                .ForeignKey("fk_recurring_entries_users", "users", "id").Indexed("ix_recurring_entries_user_id")
            .WithColumn("category_id").AsInt64().NotNullable().Indexed("ix_recurring_entries_category_id")
            .WithColumn("kind").AsInt16().NotNullable()
            .WithColumn("name").AsString(100).NotNullable()
            .WithColumn("day_of_month").AsInt32().NotNullable()
            .WithColumn("start_month").AsDate().NotNullable()
            .WithColumn("end_month").AsDate().Nullable()
            .WithColumn("notes").AsString(500).Nullable();

        Create.Table("recurring_entry_amounts")
            .WithColumn("id").AsInt64().PrimaryKey().Identity()
            .WithColumn("recurring_entry_id").AsInt64().NotNullable()
            .WithColumn("effective_month").AsDate().NotNullable()
            .WithColumn("amount").AsDecimal(12, 2).NotNullable();

        Create.Table("recurring_entry_months")
            .WithColumn("id").AsInt64().PrimaryKey().Identity()
            .WithColumn("recurring_entry_id").AsInt64().NotNullable()
            .WithColumn("month").AsDate().NotNullable()
            .WithColumn("amount").AsDecimal(12, 2).Nullable()
            .WithColumn("skipped").AsBoolean().NotNullable().WithDefaultValue(false)
            .WithColumn("settled_on").AsDate().Nullable();

        Execute.Sql(
            """
            ALTER TABLE recurring_entries
                ADD CONSTRAINT fk_recurring_entries_categories FOREIGN KEY (category_id)
                    REFERENCES categories (id) ON DELETE RESTRICT,
                ADD CONSTRAINT ck_recurring_entries_kind CHECK (kind IN (1, 2)),
                ADD CONSTRAINT ck_recurring_entries_day CHECK (day_of_month BETWEEN 1 AND 31),
                ADD CONSTRAINT ck_recurring_entries_start CHECK (extract(day FROM start_month) = 1),
                ADD CONSTRAINT ck_recurring_entries_end CHECK (end_month IS NULL
                    OR (end_month >= start_month AND extract(day FROM end_month) = 1));

            ALTER TABLE recurring_entry_amounts
                ADD CONSTRAINT fk_recurring_entry_amounts_entries FOREIGN KEY (recurring_entry_id)
                    REFERENCES recurring_entries (id) ON DELETE CASCADE,
                ADD CONSTRAINT ck_recurring_entry_amounts_amount CHECK (amount > 0),
                ADD CONSTRAINT ux_recurring_entry_amounts_month UNIQUE (recurring_entry_id, effective_month);

            ALTER TABLE recurring_entry_months
                ADD CONSTRAINT fk_recurring_entry_months_entries FOREIGN KEY (recurring_entry_id)
                    REFERENCES recurring_entries (id) ON DELETE CASCADE,
                ADD CONSTRAINT ck_recurring_entry_months_amount CHECK (amount IS NULL OR amount > 0),
                ADD CONSTRAINT ck_recurring_entry_months_state CHECK (NOT (skipped AND settled_on IS NOT NULL)),
                ADD CONSTRAINT ux_recurring_entry_months_month UNIQUE (recurring_entry_id, month);
            """);
    }
}
