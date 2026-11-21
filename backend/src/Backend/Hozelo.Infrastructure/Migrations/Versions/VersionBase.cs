using FluentMigrator;
using FluentMigrator.Builders.Create.Table;

namespace Hozelo.Infrastructure.Migrations.Versions;

public abstract class VersionBase : ForwardOnlyMigration
{
    protected ICreateTableColumnOptionOrWithColumnSyntax CreateTable(string table)
    {
        return Create.Table(table)
            .WithColumn("id").AsInt64().PrimaryKey().Identity()
            .WithColumn("created_on").AsCustom("timestamptz").NotNullable()
            .WithColumn("active").AsBoolean().NotNullable().WithDefaultValue(true);
    }
}
