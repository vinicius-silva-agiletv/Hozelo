using Microsoft.EntityFrameworkCore;

namespace Hozelo.Infrastructure.DataAccess;

public class HozeloDbContext(DbContextOptions<HozeloDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Tabelas e colunas mapeadas explicitamente em snake_case (ver Configurations/).
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(HozeloDbContext).Assembly);
    }
}
