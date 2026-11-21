using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Category.Delete;

public sealed class DeleteCategoryUseCase(
    ILoggedUser loggedUser,
    ICategoryReadOnlyRepository readOnlyRepository,
    ICategoryUpdateOnlyRepository updateOnlyRepository,
    ICategoryWriteOnlyRepository writeOnlyRepository,
    IUnitOfWork unitOfWork) : IDeleteCategoryUseCase
{
    public async Task Execute(long id)
    {
        var user = await loggedUser.User();

        var category = await updateOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.CATEGORY_NOT_FOUND);

        if (await readOnlyRepository.HasExpenses(user.Id, id))
            throw new ConflictException(ResourceMessagesException.CATEGORY_HAS_EXPENSES);

        writeOnlyRepository.Delete(category);

        await unitOfWork.Commit();
    }
}
