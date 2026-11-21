using Hozelo.Application.Validation;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Hozelo.Domain.Repositories;
using Hozelo.Domain.Repositories.OpeningBalance;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.OpeningBalance;

public sealed class OpeningBalanceUseCase(
    ILoggedUser loggedUser,
    IOpeningBalanceRepository repository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IOpeningBalanceUseCase
{
    public async Task<ResponseOpeningBalanceJson> Get()
    {
        var user = await loggedUser.User();

        var opening = await repository.Get(user.Id)
            ?? throw new NotFoundException(ResourceMessagesException.OPENING_BALANCE_NOT_FOUND);

        return ToResponse(opening);
    }

    /// <summary>Cria ou altera o saldo inicial (um por conta).</summary>
    public async Task<ResponseOpeningBalanceJson> Set(RequestOpeningBalanceJson request)
    {
        ValidationErrors.ThrowIfAny(new OpeningBalanceValidator().Validate(request).Messages());

        var user = await loggedUser.User();

        var opening = await repository.GetForUpdate(user.Id);
        if (opening is null)
        {
            opening = new Domain.Entities.OpeningBalance { UserId = user.Id };
            await repository.Add(opening);
        }

        opening.Amount = request.Amount;
        opening.ReferenceDate = request.ReferenceDate!.Value;
        opening.UpdatedOn = timeProvider.GetUtcNow().UtcDateTime;

        await unitOfWork.Commit();

        return ToResponse(opening);
    }

    private static ResponseOpeningBalanceJson ToResponse(Domain.Entities.OpeningBalance opening) =>
        new() { Amount = opening.Amount, ReferenceDate = opening.ReferenceDate };
}
