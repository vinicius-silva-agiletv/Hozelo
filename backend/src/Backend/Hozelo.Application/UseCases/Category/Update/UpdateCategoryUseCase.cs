using Hozelo.Communication.Requests;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Category.Update;

public sealed class UpdateCategoryUseCase(
    ILoggedUser loggedUser,
    ICategoryReadOnlyRepository readOnlyRepository,
    ICategoryUpdateOnlyRepository updateOnlyRepository,
    IUnitOfWork unitOfWork) : IUpdateCategoryUseCase
{
    public async Task Execute(long id, RequestCategoryJson request)
    {
        var user = await loggedUser.User();

        var category = await updateOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.CATEGORY_NOT_FOUND);

        CategoryValidator.NormalizeAndValidate(request);

        // Renomear para o próprio nome mudando só maiúsculas é permitido (a própria categoria é ignorada).
        if (await readOnlyRepository.ExistsWithName(user.Id, request.Name, excludingId: id))
            throw new ConflictException(ResourceMessagesException.CATEGORY_NAME_ALREADY_EXISTS);

        category.Name = request.Name;

        await unitOfWork.Commit();
    }
}
