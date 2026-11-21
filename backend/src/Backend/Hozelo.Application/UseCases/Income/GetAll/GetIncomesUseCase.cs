using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories.Income;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Income.GetAll;

public sealed class GetIncomesUseCase(ILoggedUser loggedUser, IIncomeReadOnlyRepository readOnlyRepository) : IGetIncomesUseCase
{
    public async Task<ResponseIncomesJson> Execute(long? categoryId, int? year, int? month)
    {
        if (year.HasValue != month.HasValue || month is < 1 or > 12 || year is < 2000 or > 2100)
            throw new ErrorOnValidationException([ResourceMessagesException.MONTH_INVALID]);

        DateOnly? from = year.HasValue ? new DateOnly(year.Value, month!.Value, 1) : null;

        var user = await loggedUser.User();

        var incomes = await readOnlyRepository.GetAll(user.Id, categoryId, from, from?.AddMonths(1));

        return new ResponseIncomesJson { Incomes = incomes.Select(IncomeMapper.ToResponse).ToList() };
    }
}
