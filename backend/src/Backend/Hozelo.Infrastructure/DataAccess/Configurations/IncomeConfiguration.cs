using Hozelo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hozelo.Infrastructure.DataAccess.Configurations;

public sealed class IncomeConfiguration : IEntityTypeConfiguration<Income>
{
    public void Configure(EntityTypeBuilder<Income> builder)
    {
        builder.ToTable("incomes");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.CreatedOn).HasColumnName("created_on");
        builder.Property(i => i.Active).HasColumnName("active");
        builder.Property(i => i.UserId).HasColumnName("user_id");
        builder.Property(i => i.CategoryId).HasColumnName("category_id");
        builder.Property(i => i.Name).HasColumnName("name").HasMaxLength(100);
        builder.Property(i => i.Amount).HasColumnName("amount").HasPrecision(12, 2);
        builder.Property(i => i.ExpectedDate).HasColumnName("expected_date");
        builder.Property(i => i.ReceivedOn).HasColumnName("received_on");
        builder.Property(i => i.Notes).HasColumnName("notes").HasMaxLength(500);

        builder.Ignore(i => i.IsReceived);

        builder.HasOne(i => i.Category).WithMany().HasForeignKey(i => i.CategoryId).OnDelete(DeleteBehavior.Restrict);
    }
}
