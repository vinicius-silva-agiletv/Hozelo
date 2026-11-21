using Hozelo.Domain.Entities;
using Hozelo.Domain.Enums;

namespace CommonTestUtilities.Entities;

public static class ExpenseBuilder
{
    /// <summary>Despesa com parcelas geradas pelo calculador real.</summary>
    public static Expense Build(
        AmountType amountType = AmountType.Installment,
        decimal amount = 1250.00m,
        int count = 48,
        DateOnly? firstDueDate = null,
        int alreadyPaid = 0,
        long id = 1,
        Category? category = null,
        string name = "Financiamento do carro")
    {
        category ??= CategoryBuilder.Build();

        var expense = new Expense
        {
            Id = id,
            UserId = 1,
            CategoryId = category.Id,
            Category = category,
            Name = name
        };

        expense.Schedule(amountType, amount, count, firstDueDate ?? new DateOnly(2025, 1, 10));
        expense.MarkFirstInstallmentsAsPaid(alreadyPaid);

        var number = 1;
        foreach (var installment in expense.Installments)
        {
            installment.Id = id * 1000 + number++;
            installment.ExpenseId = id;
            installment.Expense = expense;
        }

        return expense;
    }
}
