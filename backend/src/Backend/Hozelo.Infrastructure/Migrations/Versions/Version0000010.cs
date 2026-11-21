using FluentMigrator;

namespace Hozelo.Infrastructure.Migrations.Versions;

[Migration(DatabaseVersions.CreateTablePeople, "Cria a tabela de pessoas (terceiros que devem à família)")]
public class Version0000010 : VersionBase
{
    public override void Up()
    {
        CreateTable("people")
            .WithColumn("user_id").AsInt64().NotNullable()
                .ForeignKey("fk_people_users", "users", "id")
            .WithColumn("name").AsString(50).NotNullable();

        Execute.Sql("CREATE UNIQUE INDEX ux_people_user_name ON people (user_id, lower(name));");
    }
}
