using Hozelo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hozelo.Infrastructure.DataAccess.Configurations;

public sealed class RecurringEntryConfiguration : IEntityTypeConfiguration<RecurringEntry>
{
    public void Configure(EntityTypeBuilder<RecurringEntry> builder)
    {
        builder.ToTable("recurring_entries");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id");
        builder.Property(r => r.CreatedOn).HasColumnName("created_on");
        builder.Property(r => r.Active).HasColumnName("active");
        builder.Property(r => r.UserId).HasColumnName("user_id");
        builder.Property(r => r.CategoryId).HasColumnName("category_id");
        builder.Property(r => r.Kind).HasColumnName("kind").HasConversion<short>();
        builder.Property(r => r.Name).HasColumnName("name").HasMaxLength(100);
        builder.Property(r => r.DayOfMonth).HasColumnName("day_of_month");
        builder.Property(r => r.StartMonth).HasColumnName("start_month");
        builder.Property(r => r.EndMonth).HasColumnName("end_month");
        builder.Property(r => r.Notes).HasColumnName("notes").HasMaxLength(500);

        builder.HasOne(r => r.Category).WithMany().HasForeignKey(r => r.CategoryId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(r => r.Amounts).WithOne().HasForeignKey(a => a.RecurringEntryId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(r => r.Months).WithOne().HasForeignKey(m => m.RecurringEntryId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class RecurringEntryAmountConfiguration : IEntityTypeConfiguration<RecurringEntryAmount>
{
    public void Configure(EntityTypeBuilder<RecurringEntryAmount> builder)
    {
        builder.ToTable("recurring_entry_amounts");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id");
        builder.Property(a => a.RecurringEntryId).HasColumnName("recurring_entry_id");
        builder.Property(a => a.EffectiveMonth).HasColumnName("effective_month");
        builder.Property(a => a.Amount).HasColumnName("amount").HasPrecision(12, 2);
        builder.HasIndex(a => new { a.RecurringEntryId, a.EffectiveMonth }).IsUnique();
    }
}

public sealed class RecurringEntryMonthConfiguration : IEntityTypeConfiguration<RecurringEntryMonth>
{
    public void Configure(EntityTypeBuilder<RecurringEntryMonth> builder)
    {
        builder.ToTable("recurring_entry_months");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("id");
        builder.Property(m => m.RecurringEntryId).HasColumnName("recurring_entry_id");
        builder.Property(m => m.Month).HasColumnName("month");
        builder.Property(m => m.Amount).HasColumnName("amount").HasPrecision(12, 2);
        builder.Property(m => m.Skipped).HasColumnName("skipped");
        builder.Property(m => m.SettledOn).HasColumnName("settled_on");
        builder.Ignore(m => m.IsEmpty);
        builder.HasIndex(m => new { m.RecurringEntryId, m.Month }).IsUnique();
    }
}
