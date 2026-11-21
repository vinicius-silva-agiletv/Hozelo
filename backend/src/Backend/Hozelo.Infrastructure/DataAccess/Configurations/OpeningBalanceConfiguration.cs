using Hozelo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hozelo.Infrastructure.DataAccess.Configurations;

public sealed class OpeningBalanceConfiguration : IEntityTypeConfiguration<OpeningBalance>
{
    public void Configure(EntityTypeBuilder<OpeningBalance> builder)
    {
        builder.ToTable("opening_balances");

        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).HasColumnName("id");
        builder.Property(o => o.UserId).HasColumnName("user_id");
        builder.Property(o => o.Amount).HasColumnName("amount").HasPrecision(12, 2);
        builder.Property(o => o.ReferenceDate).HasColumnName("reference_date");
        builder.Property(o => o.UpdatedOn).HasColumnName("updated_on");
        builder.HasIndex(o => o.UserId).IsUnique();
    }
}
