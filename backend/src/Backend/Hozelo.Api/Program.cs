using System.Text.Json.Serialization;
using Hozelo.Api.Filters;
using Hozelo.Api.Token;
using Hozelo.Application;
using Hozelo.Domain.Security.Tokens;
using Hozelo.Infrastructure;
using Hozelo.Infrastructure.Migrations;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRouting(options => options.LowercaseUrls = true);

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ExceptionFilter>();
    // Campos nulos/ausentes são tratados pelos validadores, com mensagens em português.
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
}).AddJsonOptions(options =>
    // Enums como texto no JSON ("Total", "Open"...), conforme contracts/api.md.
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    const string scheme = "Bearer";

    options.AddSecurityDefinition(scheme, new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Name = "Authorization",
        Description = "Cole aqui o accessToken devolvido pelo cadastro ou login."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference(scheme, document)] = []
    });
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITokenProvider, HttpContextTokenValue>();

builder.Services.AddApplication(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Em desenvolvimento o frontend chama a API em http pelo proxy do Vite (frontend/vite.config.ts).
// Redirecionar para https (perfil "https" do launchSettings) mandaria o navegador para outra origem
// (https://localhost:7156) e a chamada seria bloqueada por CORS. Fora de desenvolvimento, segue ativo.
if (!app.Environment.IsDevelopment())
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
