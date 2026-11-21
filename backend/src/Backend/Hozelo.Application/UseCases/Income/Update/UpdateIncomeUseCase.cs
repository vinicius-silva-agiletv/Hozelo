using Hozelo.Application.UseCases.Category;
using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Domain.Repositories.Income;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Income.Update;

public sealed class UpdateIncomeUseCase(
    ILoggedUser loggedUser,
    ICategoryReadOnlyRepository categoryRepository,
    IIncomeUpdateOnlyRepository updateOnlyRepository,
    IIncomeReadOnlyRepository readOnlyRepository,
    IUnitOfWork unitOfWork) : IUpdateIncomeUseCase
{
    public async Task<ResponseIncomeJson> Execute(long id, RequestUpdateIncomeJson request)
    {
        var user = await loggedUser.User();

        var income = await updateOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.INCOME_NOT_FOUND);

        IncomeValidator.Normalize(request);
        var errors = new IncomeValidator().Validate(request).Messages();
        await CategoryChecker.Check(categoryRepository, user.Id, request.CategoryId, CategoryType.Income, errors);
        ValidationErrors.ThrowIfAny(errors);

        income.Name = request.Name;
        income.CategoryId = request.CategoryId;
        income.Amount = request.Amount;
        income.ExpectedDate = request.ExpectedDate!.Value;
        income.Notes = request.Notes;

        await unitOfWork.Commit();

        return IncomeMapper.ToResponse((await readOnlyRepository.GetById(user.Id, id))!);
    }
}
