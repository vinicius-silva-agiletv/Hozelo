using Hozelo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hozelo.Infrastructure.DataAccess.Configurations;

public sealed class PersonConfiguration : IEntityTypeConfiguration<Person>
{
    public void Configure(EntityTypeBuilder<Person> builder)
    {
        builder.ToTable("people");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.CreatedOn).HasColumnName("created_on");
        builder.Property(p => p.Active).HasColumnName("active");
        builder.Property(p => p.UserId).HasColumnName("user_id");
        builder.Property(p => p.Name).HasColumnName("name").HasMaxLength(50);
    }
}

public sealed class PersonChargeConfiguration : IEntityTypeConfiguration<PersonCharge>
{
    public void Configure(EntityTypeBuilder<PersonCharge> builder)
    {
        builder.ToTable("person_charges");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.CreatedOn).HasColumnName("created_on");
        builder.Property(c => c.Active).HasColumnName("active");
        builder.Property(c => c.UserId).HasColumnName("user_id");
        builder.Property(c => c.PersonId).HasColumnName("person_id");
        builder.Property(c => c.Description).HasColumnName("description").HasMaxLength(100);
        builder.Property(c => c.Amount).HasColumnName("amount").HasPrecision(12, 2);
        builder.Property(c => c.ChargeDate).HasColumnName("charge_date");
        builder.Property(c => c.Notes).HasColumnName("notes").HasMaxLength(500);
    }
}

public sealed class PersonPaymentConfiguration : IEntityTypeConfiguration<PersonPayment>
{
    public void Configure(EntityTypeBuilder<PersonPayment> builder)
    {
        builder.ToTable("person_payments");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.CreatedOn).HasColumnName("created_on");
        builder.Property(p => p.Active).HasColumnName("active");
        builder.Property(p => p.UserId).HasColumnName("user_id");
        builder.Property(p => p.PersonId).HasColumnName("person_id");
        builder.Property(p => p.Amount).HasColumnName("amount").HasPrecision(12, 2);
        builder.Property(p => p.PaidOn).HasColumnName("paid_on");
        builder.Property(p => p.Notes).HasColumnName("notes").HasMaxLength(500);
        builder.Ignore(p => p.TargetKeys);
        builder.HasMany(p => p.Targets).WithOne().HasForeignKey(t => t.PersonPaymentId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class PersonPaymentTargetConfiguration : IEntityTypeConfiguration<PersonPaymentTarget>
{
    public void Configure(EntityTypeBuilder<PersonPaymentTarget> builder)
    {
        builder.ToTable("person_payment_targets");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");
        builder.Property(t => t.PersonPaymentId).HasColumnName("person_payment_id");
        builder.Property(t => t.ChargeKey).HasColumnName("charge_key").HasMaxLength(80);
        builder.Property(t => t.Position).HasColumnName("position");
    }
}
