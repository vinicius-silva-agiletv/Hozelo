using Hozelo.Api.Filters;
using Hozelo.Application;
using Hozelo.Infrastructure;
using Hozelo.Infrastructure.Migrations;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRouting(options => options.LowercaseUrls = true);

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ExceptionFilter>();
    // Campos nulos/ausentes são tratados pelos validadores, com mensagens em português.
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddApplication(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapControllers();

MigrateDatabase();

app.Run();

void MigrateDatabase()
{
    var connectionString = builder.Configuration.ConnectionString();
    DatabaseMigration.Migrate(connectionString, app.Services);
}

// Permite que o WebApplicationFactory (testes de integracao) encontre a classe Program.
public partial class Program { }
