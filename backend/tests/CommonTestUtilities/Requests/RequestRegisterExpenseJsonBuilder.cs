using Hozelo.Communication.Enums;
using Hozelo.Communication.Requests;

namespace CommonTestUtilities.Requests;

public static class RequestRegisterExpenseJsonBuilder
{
    /// <summary>Despesa parcelada válida: R$ 3.000,00 em 10x, primeira parcela em 05/01/2027.</summary>
    public static RequestRegisterExpenseJson Build(long categoryId = 1) => new()
    {
        Name = "Geladeira",
        CategoryId = categoryId,
        AmountType = AmountType.Total,
        Amount = 3000.00m,
        IsInstallment = true,
        InstallmentsCount = 10,
        FirstDueDate = new DateOnly(2027, 1, 5),
        AlreadyPaidInstallments = 0,
        Notes = "Loja X"
    };

    public static RequestRegisterExpenseJson Single(long categoryId, decimal amount, DateOnly dueDate) => new()
    {
        Name = "Conta de água",
        CategoryId = categoryId,
        AmountType = AmountType.Total,
        Amount = amount,
        IsInstallment = false,
        InstallmentsCount = 1,
        FirstDueDate = dueDate
    };

    public static RequestRegisterExpenseJson Installments(
        long categoryId, decimal installmentAmount, int count, DateOnly firstDueDate, int alreadyPaid = 0) => new()
    {
        Name = "Financiamento do carro",
        CategoryId = categoryId,
        AmountType = AmountType.Installment,
        Amount = installmentAmount,
        IsInstallment = count > 1,
        InstallmentsCount = count,
        FirstDueDate = firstDueDate,
        AlreadyPaidInstallments = alreadyPaid
    };
}
