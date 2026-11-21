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
}
