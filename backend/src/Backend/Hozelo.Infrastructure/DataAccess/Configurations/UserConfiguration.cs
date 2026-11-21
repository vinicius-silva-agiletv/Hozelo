using Hozelo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hozelo.Infrastructure.DataAccess.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("id");
        builder.Property(u => u.CreatedOn).HasColumnName("created_on");
        builder.Property(u => u.Active).HasColumnName("active");
        builder.Property(u => u.UserIdentifier).HasColumnName("user_identifier");
        builder.Property(u => u.Name).HasColumnName("name").HasMaxLength(100);
        builder.Property(u => u.Email).HasColumnName("email").HasMaxLength(255);
        builder.Property(u => u.Password).HasColumnName("password").HasMaxLength(255);
    }
}
