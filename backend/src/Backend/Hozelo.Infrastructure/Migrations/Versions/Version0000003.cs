using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.CreateTableCategories, "Cria a tabela de categorias de despesas")]
public class Version0000003 : VersionBase
{
    public override void Up()
    {
        CreateTable("categories")
            .WithColumn("user_id").AsInt64().NotNullable()
                .ForeignKey("fk_categories_users", "users", "id")
            .WithColumn("name").AsString(50).NotNullable();

        // Nome único por usuário, ignorando maiúsculas/minúsculas (research.md §8).
        Execute.Sql("CREATE UNIQUE INDEX ux_categories_user_name ON categories (user_id, lower(name));");
    }
}
