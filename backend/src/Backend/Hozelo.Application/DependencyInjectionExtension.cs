using Hozelo.Application.Settings;
using Hozelo.Application.UseCases.Category.Delete;
using Hozelo.Application.UseCases.Category.GetAll;
using Hozelo.Application.UseCases.Category.Register;
using Hozelo.Application.UseCases.Category.Update;
using Hozelo.Application.UseCases.Expense.Amortize;
using Hozelo.Application.UseCases.Expense.Delete;
using Hozelo.Application.UseCases.Expense.GetAll;
using Hozelo.Application.UseCases.Expense.GetById;
using Hozelo.Application.UseCases.Expense.PayInstallment;
using Hozelo.Application.UseCases.Expense.Register;
using Hozelo.Application.UseCases.Expense.UndoInstallmentPayment;
using Hozelo.Application.UseCases.Expense.Update;
using Hozelo.Application.UseCases.Income.Delete;
using Hozelo.Application.UseCases.Income.GetAll;
using Hozelo.Application.UseCases.Income.GetById;
using Hozelo.Application.UseCases.Income.Receive;
using Hozelo.Application.UseCases.Income.Register;
using Hozelo.Application.UseCases.Income.Update;
using Hozelo.Application.UseCases.Installment.GetMonthly;
using Hozelo.Application.UseCases.OpeningBalance;
using Hozelo.Application.UseCases.Person;
using Hozelo.Application.UseCases.Person.Entries;
using Hozelo.Application.UseCases.Person.Statement;
using Hozelo.Application.UseCases.Summary.GetMonthly;
using Hozelo.Application.UseCases.Recurrence.Delete;
using Hozelo.Application.UseCases.Recurrence.Get;
using Hozelo.Application.UseCases.Recurrence.Months;
using Hozelo.Application.UseCases.Recurrence.Period;
using Hozelo.Application.UseCases.Recurrence.Register;
using Hozelo.Application.UseCases.Recurrence.Update;
using Hozelo.Application.UseCases.Login.DoLogin;
using Hozelo.Application.UseCases.User.Profile;
using Hozelo.Application.UseCases.User.Register;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Hozelo.Application;

public static class DependencyInjectionExtension
{
    public static void AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        AddSettings(services, configuration);
        AddUseCases(services);
    }

    private static void AddSettings(IServiceCollection services, IConfiguration configuration)
    {
        var lockout = configuration.GetSection(LoginLockoutSettings.Section).Get<LoginLockoutSettings>()
            ?? new LoginLockoutSettings();

        services.AddSingleton(lockout);
    }

    private static void AddUseCases(IServiceCollection services)
    {
        services.AddScoped<IRegisterUserUseCase, RegisterUserUseCase>();
        services.AddScoped<IDoLoginUseCase, DoLoginUseCase>();
        services.AddScoped<IGetUserProfileUseCase, GetUserProfileUseCase>();

        services.AddScoped<IRegisterCategoryUseCase, RegisterCategoryUseCase>();
        services.AddScoped<IUpdateCategoryUseCase, UpdateCategoryUseCase>();
        services.AddScoped<IDeleteCategoryUseCase, DeleteCategoryUseCase>();
        services.AddScoped<IGetCategoriesUseCase, GetCategoriesUseCase>();

        services.AddScoped<IRegisterExpenseUseCase, RegisterExpenseUseCase>();
        services.AddScoped<IGetExpenseByIdUseCase, GetExpenseByIdUseCase>();
        services.AddScoped<IGetExpensesUseCase, GetExpensesUseCase>();
        services.AddScoped<IUpdateExpenseUseCase, UpdateExpenseUseCase>();
        services.AddScoped<IDeleteExpenseUseCase, DeleteExpenseUseCase>();
        services.AddScoped<IPayInstallmentUseCase, PayInstallmentUseCase>();
        services.AddScoped<IUndoInstallmentPaymentUseCase, UndoInstallmentPaymentUseCase>();
        services.AddScoped<IAmortizeExpenseUseCase, AmortizeExpenseUseCase>();

        services.AddScoped<IGetMonthlyInstallmentsUseCase, GetMonthlyInstallmentsUseCase>();

        services.AddScoped<IRegisterIncomeUseCase, RegisterIncomeUseCase>();
        services.AddScoped<IUpdateIncomeUseCase, UpdateIncomeUseCase>();
        services.AddScoped<IDeleteIncomeUseCase, DeleteIncomeUseCase>();
        services.AddScoped<IGetIncomeByIdUseCase, GetIncomeByIdUseCase>();
        services.AddScoped<IGetIncomesUseCase, GetIncomesUseCase>();
        services.AddScoped<IReceiveIncomeUseCase, ReceiveIncomeUseCase>();

        services.AddScoped<IRegisterRecurrenceUseCase, RegisterRecurrenceUseCase>();
        services.AddScoped<IUpdateRecurrenceUseCase, UpdateRecurrenceUseCase>();
        services.AddScoped<IDeleteRecurrenceUseCase, DeleteRecurrenceUseCase>();
        services.AddScoped<IGetRecurrencesUseCase, GetRecurrencesUseCase>();
        services.AddScoped<IRecurrencePeriodUseCase, RecurrencePeriodUseCase>();
        services.AddScoped<IRecurrenceMonthUseCase, RecurrenceMonthUseCase>();

        services.AddScoped<IOpeningBalanceUseCase, OpeningBalanceUseCase>();
        services.AddScoped<IGetMonthlySummaryUseCase, GetMonthlySummaryUseCase>();

        services.AddScoped<IPersonLedgerLoader, PersonLedgerLoader>();
        services.AddScoped<IPersonUseCase, PersonUseCase>();
        services.AddScoped<IPersonEntriesUseCase, PersonEntriesUseCase>();
        services.AddScoped<IPersonStatementUseCase, PersonStatementUseCase>();
    }
}
