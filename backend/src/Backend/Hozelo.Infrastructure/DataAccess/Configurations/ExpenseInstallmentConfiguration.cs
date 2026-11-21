using Hozelo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hozelo.Infrastructure.DataAccess.Configurations;

public sealed class ExpenseInstallmentConfiguration : IEntityTypeConfiguration<ExpenseInstallment>
{
    public void Configure(EntityTypeBuilder<ExpenseInstallment> builder)
    {
        builder.ToTable("expense_installments");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.ExpenseId).HasColumnName("expense_id");
        builder.Property(i => i.Number).HasColumnName("number");
        builder.Property(i => i.DueDate).HasColumnName("due_date");
        builder.Property(i => i.Amount).HasColumnName("amount").HasPrecision(12, 2);
        builder.Property(i => i.PaidOn).HasColumnName("paid_on");
        builder.Property(i => i.PaidAmount).HasColumnName("paid_amount").HasPrecision(12, 2);
        builder.Property(i => i.Prepaid).HasColumnName("prepaid");

        builder.Ignore(i => i.IsPaid);
        builder.Ignore(i => i.Discount);

        builder.HasIndex(i => new { i.ExpenseId, i.Number }).IsUnique();
    }
}
