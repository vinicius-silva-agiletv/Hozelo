namespace Hozelo.Application.UseCases.Recurrence.Delete;

public interface IDeleteRecurrenceUseCase
{
    Task Execute(long id);
}
