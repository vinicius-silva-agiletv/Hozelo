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
using Hozelo.Application.UseCases.Installment.GetMonthly;
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
    }
}
