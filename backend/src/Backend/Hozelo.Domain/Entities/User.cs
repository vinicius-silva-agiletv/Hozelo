namespace Hozelo.Domain.Entities;

/// <summary>Conta compartilhada da família. Existe no máximo uma.</summary>
public class User : EntityBase
{
    public Guid UserIdentifier { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>Sempre minúsculo e sem espaços nas pontas.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Hash da senha; nunca o texto puro.</summary>
    public string Password { get; set; } = string.Empty;
}
