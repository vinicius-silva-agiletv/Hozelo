using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Category.Register;

public sealed class RegisterCategoryUseCase(
    ILoggedUser loggedUser,
    ICategoryReadOnlyRepository readOnlyRepository,
    ICategoryWriteOnlyRepository writeOnlyRepository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IRegisterCategoryUseCase
{
    public async Task<ResponseCategoryJson> Execute(RequestCategoryJson request)
    {
        var user = await loggedUser.User();

        CategoryValidator.NormalizeAndValidate(request);

        if (await readOnlyRepository.ExistsWithName(user.Id, request.Name))
            throw new ConflictException(ResourceMessagesException.CATEGORY_NAME_ALREADY_EXISTS);

        var category = new Domain.Entities.Category
        {
            UserId = user.Id,
            Name = request.Name,
            CreatedOn = timeProvider.GetUtcNow().UtcDateTime
        };

        await writeOnlyRepository.Add(category);
        await unitOfWork.Commit();

        return new ResponseCategoryJson { Id = category.Id, Name = category.Name, ExpensesCount = 0 };
    }
}
