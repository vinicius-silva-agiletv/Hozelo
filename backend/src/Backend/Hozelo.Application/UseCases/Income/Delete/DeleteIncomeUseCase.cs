using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Income;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Income.Delete;

public sealed class DeleteIncomeUseCase(
    ILoggedUser loggedUser,
    IIncomeUpdateOnlyRepository updateOnlyRepository,
    IIncomeWriteOnlyRepository writeOnlyRepository,
    IUnitOfWork unitOfWork) : IDeleteIncomeUseCase
{
    public async Task Execute(long id)
    {
        var user = await loggedUser.User();

        var income = await updateOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.INCOME_NOT_FOUND);

        writeOnlyRepository.Delete(income);
        await unitOfWork.Commit();
    }
}
