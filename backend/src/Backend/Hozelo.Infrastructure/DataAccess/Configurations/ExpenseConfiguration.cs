using Hozelo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hozelo.Infrastructure.DataAccess.Configurations;

public sealed class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.ToTable("expenses");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.CreatedOn).HasColumnName("created_on");
        builder.Property(e => e.Active).HasColumnName("active");
        builder.Property(e => e.UserId).HasColumnName("user_id");
        builder.Property(e => e.CategoryId).HasColumnName("category_id");
        builder.Property(e => e.Name).HasColumnName("name").HasMaxLength(100);
        builder.Property(e => e.AmountType).HasColumnName("amount_type").HasConversion<short>();
        builder.Property(e => e.TotalAmount).HasColumnName("total_amount").HasPrecision(12, 2);
        builder.Property(e => e.InstallmentAmount).HasColumnName("installment_amount").HasPrecision(12, 2);
        builder.Property(e => e.InstallmentsCount).HasColumnName("installments_count");
        builder.Property(e => e.FirstDueDate).HasColumnName("first_due_date");
        builder.Property(e => e.Notes).HasColumnName("notes").HasMaxLength(500);

        builder.Ignore(e => e.InformedAmount);

        builder.HasOne(e => e.Category)
            .WithMany()
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Installments)
            .WithOne(i => i.Expense)
            .HasForeignKey(i => i.ExpenseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
