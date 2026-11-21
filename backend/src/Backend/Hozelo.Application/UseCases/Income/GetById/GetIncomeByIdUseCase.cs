using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories.Income;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Income.GetById;

public sealed class GetIncomeByIdUseCase(ILoggedUser loggedUser, IIncomeReadOnlyRepository readOnlyRepository) : IGetIncomeByIdUseCase
{
    public async Task<ResponseIncomeJson> Execute(long id)
    {
        var user = await loggedUser.User();

        var income = await readOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.INCOME_NOT_FOUND);

        return IncomeMapper.ToResponse(income);
    }
}
