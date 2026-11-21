using Hozelo.Domain.Repositories.Person;
using Hozelo.Exception;

namespace Hozelo.Application.UseCases.Person;

public static class PersonChecker
{
    /// <summary>Confere a pessoa da marcação (se informada); acrescenta o erro em <paramref name="errors"/>.</summary>
    public static async Task<Domain.Entities.Person?> Check(IPersonReadOnlyRepository repository, long userId, long? personId, IList<string> errors)
    {
        if (personId is null)
            return null;

        var person = personId > 0 ? await repository.GetById(userId, personId.Value) : null;
        if (person is null)
            errors.Add(ResourceMessagesException.PERSON_NOT_EXISTS);

        return person;
    }

    /// <summary>Percentual efetivo: 100 por padrão quando há pessoa; null sem pessoa.</summary>
    public static int? Percent(long? personId, int? percent) => personId is null ? null : percent ?? 100;
}
