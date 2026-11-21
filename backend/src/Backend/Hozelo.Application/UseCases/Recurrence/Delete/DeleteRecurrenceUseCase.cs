using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Recurrence;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Recurrence.Delete;

/// <summary>Remove a recorrência e todos os seus meses (para manter o histórico, use encerrar).</summary>
public sealed class DeleteRecurrenceUseCase(
    ILoggedUser loggedUser,
    IRecurrenceUpdateOnlyRepository updateOnlyRepository,
    IRecurrenceWriteOnlyRepository writeOnlyRepository,
    IUnitOfWork unitOfWork) : IDeleteRecurrenceUseCase
{
    public async Task Execute(long id)
    {
        var user = await loggedUser.User();

        var entry = await updateOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.RECURRENCE_NOT_FOUND);

        writeOnlyRepository.Delete(entry);
        await unitOfWork.Commit();
    }
}
