namespace Hozelo.Domain.Services.LoggedUser;

/// <summary>Conta autenticada na requisição atual.</summary>
public interface ILoggedUser
{
    Task<Entities.User> User();
}
