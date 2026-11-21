namespace Hozelo.Domain.Repositories.Income;

public interface IIncomeWriteOnlyRepository
{
    Task Add(Entities.Income income);

    void Delete(Entities.Income income);
}
