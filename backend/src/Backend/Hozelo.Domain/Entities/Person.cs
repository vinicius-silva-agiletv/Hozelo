namespace Hozelo.Domain.Entities;

/// <summary>Terceiro que deve dinheiro à família (data-model.md, Person).</summary>
public class Person : EntityBase
{
    public long UserId { get; set; }

    public string Name { get; set; } = string.Empty;
}
