using Hozelo.Domain.Repositories;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Hozelo.Infrastructure.DataAccess;

public sealed class UnitOfWork(HozeloDbContext dbContext) : IUnitOfWork
{
    private const string UniqueViolation = "23505";
    private const string CategoryNameConstraint = "ux_categories_user_name";

    private static readonly string[] SingleAccountConstraints = ["ux_users_single_account", "ux_users_email"];

    public async Task Commit()
    {
        try
        {
            await dbContext.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException
        {
            SqlState: UniqueViolation,
            ConstraintName: var constraint
        } && SingleAccountConstraints.Contains(constraint))
        {
            // Cadastro concorrente: o índice garante a conta única (research.md §6).
            throw new AccountAlreadyExistsException();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException
        {
            SqlState: UniqueViolation,
            ConstraintName: CategoryNameConstraint
        })
        {
            // Nome de categoria gravado em paralelo (research.md 002 §8).
            throw new ConflictException(ResourceMessagesException.CATEGORY_NAME_ALREADY_EXISTS);
        }
    }
}
