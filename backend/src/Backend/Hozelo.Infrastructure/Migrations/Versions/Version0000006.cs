using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.AddCategoryType, "Separa categorias por tipo (despesa / receita)")]
public class Version0000006 : ForwardOnlyMigration
{
    public override void Up()
    {
        // Categorias existentes viram despesa (FR-002); nome passa a ser único por tipo (FR-003).
        Execute.Sql(
            """
            ALTER TABLE categories
                ADD COLUMN type smallint NOT NULL DEFAULT 1,
                ADD CONSTRAINT ck_categories_type CHECK (type IN (1, 2));
            DROP INDEX ux_categories_user_name;
            CREATE UNIQUE INDEX ux_categories_user_type_name ON categories (user_id, type, lower(name));
            """);
    }
}
