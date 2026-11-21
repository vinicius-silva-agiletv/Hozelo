using Hozelo.Application.Summaries;
using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Application.UseCases.Category;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Category;
using Hozelo.Domain.Repositories.Expense;
using Hozelo.Domain.Repositories.Person;
using Hozelo.Application.UseCases.Person;
using Hozelo.Domain.Services.LoggedUser;

namespace Hozelo.Application.UseCases.Expense.Register;

public sealed class RegisterExpenseUseCase(
    ILoggedUser loggedUser,
    ICategoryReadOnlyRepository categoryRepository,
    IPersonReadOnlyRepository personRepository,
    IExpenseWriteOnlyRepository writeOnlyRepository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IRegisterExpenseUseCase
{
    public async Task<ResponseExpenseJson> Execute(RequestRegisterExpenseJson request)
    {
        var user = await loggedUser.User();

        ExpenseValidator.Normalize(request);

        var errors = new RegisterExpenseValidator().Validate(request).Messages();

        var category = await CategoryChecker.Check(categoryRepository, user.Id, request.CategoryId, CategoryType.Expense, errors);
        var person = await PersonChecker.Check(personRepository, user.Id, request.PersonId, errors);

        ValidationErrors.ThrowIfAny(errors);

        var expense = new Domain.Entities.Expense
        {
            UserId = user.Id,
            CategoryId = category!.Id,
            Name = request.Name,
            Notes = request.Notes,
            PersonId = request.PersonId,
            PersonPercent = PersonChecker.Percent(request.PersonId, request.PersonPercent),
            CreatedOn = timeProvider.GetUtcNow().UtcDateTime
        };

        expense.Schedule((AmountType)(int)request.AmountType!.Value, request.Amount, request.InstallmentsCount, request.FirstDueDate!.Value);
        expense.MarkFirstInstallmentsAsPaid(request.AlreadyPaidInstallments);

        await writeOnlyRepository.Add(expense);
        await unitOfWork.Commit();

        // Só para montar a resposta (depois de gravar, para o EF não tentar inserir a categoria).
        expense.Category = category;
        expense.Person = person;

        return ExpenseMapper.ToResponse(expense);
    }
}
