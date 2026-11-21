using Hozelo.Domain.Entities;

namespace Hozelo.Domain.Repositories.Installment;

public interface IInstallmentReadOnlyRepository
{
    /// <summary>
    /// Parcelas que pertencem ao mês [<paramref name="monthStart"/>, <paramref name="nextMonthStart"/>)
    /// (research.md §12): vencem no mês e não foram pagas antes dele, ou foram pagas no mês antes do
    /// mês de vencimento. Inclui a despesa e a categoria.
    /// </summary>
    Task<IList<ExpenseInstallment>> GetByMonth(long userId, DateOnly monthStart, DateOnly nextMonthStart, long? categoryId);

    /// <summary>
    /// Mesma regra de <see cref="GetByMonth"/> para um intervalo de meses [<paramref name="start"/>,
    /// <paramref name="end"/>): cada parcela pertence a um único mês de referência dentro do intervalo.
    /// </summary>
    Task<IList<ExpenseInstallment>> GetByRange(long userId, DateOnly start, DateOnly end, long? categoryId);
}
