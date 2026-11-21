using Hozelo.Communication.Responses;
using Hozelo.Domain.Enums;
using Hozelo.Domain.Repositories.Recurrence;
using Hozelo.Domain.Services.Calendar;
using Hozelo.Domain.Services.LoggedUser;
using Hozelo.Exception;
using Hozelo.Exception.ExceptionsBase;

namespace Hozelo.Application.UseCases.Recurrence.Get;

public sealed class GetRecurrencesUseCase(
    ILoggedUser loggedUser,
    IRecurrenceReadOnlyRepository readOnlyRepository,
    ICalendar calendar) : IGetRecurrencesUseCase
{
    public async Task<ResponseRecurrencesJson> GetAll(string? kind, long? categoryId)
    {
        var kindFilter = ParseKind(kind);

        var user = await loggedUser.User();
        var today = calendar.Today();

        var entries = await readOnlyRepository.GetAll(user.Id, kindFilter, categoryId);

        return new ResponseRecurrencesJson
        {
            Recurrences = entries.Select(e => RecurrenceMapper.ToShortResponse(e, today)).ToList()
        };
    }

    public async Task<ResponseRecurrenceJson> GetById(long id)
    {
        var user = await loggedUser.User();

        var entry = await readOnlyRepository.GetById(user.Id, id)
            ?? throw new NotFoundException(ResourceMessagesException.RECURRENCE_NOT_FOUND);

        return RecurrenceMapper.ToResponse(entry, calendar.Today());
    }

    private static EntryKind? ParseKind(string? kind)
    {
        if (string.IsNullOrWhiteSpace(kind))
            return null;

        if (!int.TryParse(kind, out _) && Enum.TryParse<EntryKind>(kind, ignoreCase: true, out var parsed) && Enum.IsDefined(parsed))
            return parsed;

        throw new ErrorOnValidationException([ResourceMessagesException.RECURRENCE_KIND_INVALID]);
    }
}
