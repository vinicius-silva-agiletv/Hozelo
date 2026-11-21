using Hozelo.Application.UseCases.Category;
using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Domain.Repositories.Income;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.Income.Register;

public sealed class RegisterIncomeUseCase(
    ILoggedUser loggedUser,
    ICategoryReadOnlyRepository categoryRepository,
    IIncomeWriteOnlyRepository writeOnlyRepository,
    IUnitOfWork unitOfWork,
    ICalendar calendar,
    TimeProvider timeProvider) : IRegisterIncomeUseCase
{
    public async Task<ResponseIncomeJson> Execute(RequestIncomeJson request)
    {
        var user = await loggedUser.User();

        IncomeValidator.Normalize(request);

        var errors = new IncomeValidator().Validate(request).Messages();
        if (request.ReceivedOn > calendar.Today())
            errors.Add(ResourceMessagesException.DATE_IN_FUTURE);

        var category = await CategoryChecker.Check(categoryRepository, user.Id, request.CategoryId, CategoryType.Income, errors);

        ValidationErrors.ThrowIfAny(errors);

        var income = new Domain.Entities.Income
        {
            UserId = user.Id,
            CategoryId = category!.Id,
            Name = request.Name,
            Amount = request.Amount,
            ExpectedDate = request.ExpectedDate!.Value,
            ReceivedOn = request.ReceivedOn,
            Notes = request.Notes,
            CreatedOn = timeProvider.GetUtcNow().UtcDateTime
        };

        await writeOnlyRepository.Add(income);
        await unitOfWork.Commit();

        income.Category = category;
        return IncomeMapper.ToResponse(income);
    }
}
