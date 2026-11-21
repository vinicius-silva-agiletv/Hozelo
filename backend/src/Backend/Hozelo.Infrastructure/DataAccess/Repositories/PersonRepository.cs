using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.Person;
using Microsoft.EntityFrameworkCore;

namespace Hozelo.Infrastructure.DataAccess.Repositories;

public sealed class PersonRepository(HozeloDbContext dbContext)
    : IPersonReadOnlyRepository, IPersonWriteOnlyRepository, IPersonUpdateOnlyRepository, IPersonChargeRepository, IPersonPaymentRepository
{
    // ---- pessoas
    public async Task<IList<Person>> GetAll(long userId) =>
        await dbContext.Set<Person>().AsNoTracking().Where(p => p.UserId == userId).OrderBy(p => p.Name.ToLower()).ToListAsync();

    Task<Person?> IPersonReadOnlyRepository.GetById(long userId, long personId) =>
        dbContext.Set<Person>().AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId && p.Id == personId);

    public Task<bool> ExistsWithName(long userId, string name, long? excludingId = null)
    {
        var lowered = name.ToLower();
        return dbContext.Set<Person>().AnyAsync(p =>
            p.UserId == userId && p.Name.ToLower() == lowered && (excludingId == null || p.Id != excludingId));
    }

    public async Task<bool> HasEntries(long userId, long personId) =>
        await dbContext.Set<PersonCharge>().AnyAsync(c => c.UserId == userId && c.PersonId == personId)
        || await dbContext.Set<PersonPayment>().AnyAsync(p => p.UserId == userId && p.PersonId == personId)
        || await dbContext.Set<Expense>().AnyAsync(e => e.UserId == userId && e.PersonId == personId)
        || await dbContext.Set<RecurringEntry>().AnyAsync(r => r.UserId == userId && r.PersonId == personId);

    public async Task Add(Person person) => await dbContext.Set<Person>().AddAsync(person);

    public void Delete(Person person) => dbContext.Set<Person>().Remove(person);

    Task<Person?> IPersonUpdateOnlyRepository.GetById(long userId, long personId) =>
        dbContext.Set<Person>().FirstOrDefaultAsync(p => p.UserId == userId && p.Id == personId);

    // ---- cobranças avulsas
    async Task<IList<PersonCharge>> IPersonChargeRepository.GetAll(long userId, long? personId) =>
        await dbContext.Set<PersonCharge>().AsNoTracking()
            .Where(c => c.UserId == userId && (personId == null || c.PersonId == personId))
            .ToListAsync();

    public Task<PersonCharge?> GetForUpdate(long userId, long personId, long chargeId) =>
        dbContext.Set<PersonCharge>().FirstOrDefaultAsync(c => c.UserId == userId && c.PersonId == personId && c.Id == chargeId);

    public async Task Add(PersonCharge charge) => await dbContext.Set<PersonCharge>().AddAsync(charge);

    public void Delete(PersonCharge charge) => dbContext.Set<PersonCharge>().Remove(charge);

    // ---- pagamentos
    async Task<IList<PersonPayment>> IPersonPaymentRepository.GetAll(long userId, long? personId) =>
        await dbContext.Set<PersonPayment>().AsNoTracking().Include(p => p.Targets)
            .Where(p => p.UserId == userId && (personId == null || p.PersonId == personId))
            .ToListAsync();

    Task<PersonPayment?> IPersonPaymentRepository.GetForUpdate(long userId, long personId, long paymentId) =>
        dbContext.Set<PersonPayment>().Include(p => p.Targets)
            .FirstOrDefaultAsync(p => p.UserId == userId && p.PersonId == personId && p.Id == paymentId);

    public async Task Add(PersonPayment payment) => await dbContext.Set<PersonPayment>().AddAsync(payment);

    public void Delete(PersonPayment payment) => dbContext.Set<PersonPayment>().Remove(payment);
}
