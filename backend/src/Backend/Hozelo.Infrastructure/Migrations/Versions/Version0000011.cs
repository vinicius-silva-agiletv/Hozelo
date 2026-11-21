using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.AddPersonMarking, "Marca despesas e contas fixas como de uma pessoa")]
public class Version0000011 : ForwardOnlyMigration
{
    public override void Up()
    {
        Execute.Sql(
            """
            ALTER TABLE expenses
                ADD COLUMN person_id bigint NULL,
                ADD COLUMN person_percent smallint NULL,
                ADD CONSTRAINT fk_expenses_people FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE RESTRICT,
                ADD CONSTRAINT ck_expenses_person CHECK ((person_id IS NULL) = (person_percent IS NULL)),
                ADD CONSTRAINT ck_expenses_person_percent CHECK (person_percent BETWEEN 1 AND 100);
            CREATE INDEX ix_expenses_person_id ON expenses (person_id);

            ALTER TABLE recurring_entries
                ADD COLUMN person_id bigint NULL,
                ADD COLUMN person_percent smallint NULL,
                ADD CONSTRAINT fk_recurring_entries_people FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE RESTRICT,
                ADD CONSTRAINT ck_recurring_entries_person CHECK ((person_id IS NULL) = (person_percent IS NULL)),
                ADD CONSTRAINT ck_recurring_entries_person_percent CHECK (person_percent BETWEEN 1 AND 100),
                ADD CONSTRAINT ck_recurring_entries_person_kind CHECK (person_id IS NULL OR kind = 1);
            CREATE INDEX ix_recurring_entries_person_id ON recurring_entries (person_id);
            """);
    }
}
