using Hozelo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hozelo.Infrastructure.DataAccess.Configurations;

public sealed class LoginThrottleConfiguration : IEntityTypeConfiguration<LoginThrottle>
{
    public void Configure(EntityTypeBuilder<LoginThrottle> builder)
    {
        builder.ToTable("login_throttle");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(t => t.FailedAttempts).HasColumnName("failed_attempts");
        builder.Property(t => t.LockedUntilUtc).HasColumnName("locked_until_utc");
    }
}
