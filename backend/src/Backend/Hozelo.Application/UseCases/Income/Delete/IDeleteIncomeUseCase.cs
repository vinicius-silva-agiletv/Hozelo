namespace Hozelo.Application.UseCases.Income.Delete;

public interface IDeleteIncomeUseCase
{
    Task Execute(long id);
}
