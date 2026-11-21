using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.Income;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Income.Receive;

/// <summary>Confirma ou desfaz o recebimento de uma receita avulsa (idempotente).</summary>
public sealed class ReceiveIncomeUseCase(
    ILoggedUser loggedUser,
    IIncomeUpdateOnlyRepository updateOnlyRepository,
    IIncomeReadOnlyRepository readOnlyRepository,
    IUnitOfWork unitOfWork,
    ICalendar calendar) : IReceiveIncomeUseCase
{
    public async Task<ResponseIncomeJson> Execute(long id, RequestReceiveIncomeJson? request)
    {
        var today = calendar.Today();
        var receivedOn = request?.ReceivedOn ?? today;

        if (receivedOn > today)
            throw new ErrorOnValidationException([ResourceMessagesException.DATE_IN_FUTURE]);

        return await Change(id, income => income.Receive(receivedOn));
    }

    public Task<ResponseIncomeJson> Undo(long id) => Change(id, income => income.UndoReceipt());

    private async Task<ResponseIncomeJson> Change(long id, Action<Domain.Entities.Income> change)
    {
        var user = await loggedUser.User();

        var income = await updateOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.INCOME_NOT_FOUND);

        change(income);
        await unitOfWork.Commit();

        return IncomeMapper.ToResponse((await readOnlyRepository.GetById(user.Id, id))!);
    }
}
