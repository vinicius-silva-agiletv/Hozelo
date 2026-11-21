using Hozelo.Domain.Entities;
using Hozelo.Domain.Repositories.Expense;
using Moq;

namespace CommonTestUtilities.Repositories;

/// <summary>Mocks dos repositórios de despesa: a mesma instância é devolvida para leitura e alteração.</summary>
public class ExpenseRepositoryBuilder
{
    public Mock<IExpenseReadOnlyRepository> ReadOnly { get; } = new();
    public Mock<IExpenseWriteOnlyRepository> WriteOnly { get; } = new();
    public Mock<IExpenseUpdateOnlyRepository> UpdateOnly { get; } = new();

    public ExpenseRepositoryBuilder WithExpense(Expense expense)
    {
        ReadOnly.Setup(r => r.GetById(expense.UserId, expense.Id)).ReturnsAsync(expense);
        UpdateOnly.Setup(r => r.GetById(expense.UserId, expense.Id)).ReturnsAsync(expense);
        return this;
    }

    public ExpenseRepositoryBuilder WithAll(params Expense[] expenses)
    {
        ReadOnly.Setup(r => r.GetAll(It.IsAny<long>(), It.IsAny<long?>()))
            .ReturnsAsync((long _, long? categoryId) =>
                expenses.Where(e => categoryId == null || e.CategoryId == categoryId).ToList());
        return this;
    }
}
