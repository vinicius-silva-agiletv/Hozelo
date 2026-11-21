using Hozelo.Communication.Requests;

namespace CommonTestUtilities.Requests;

public static class RequestPersonJsonBuilder
{
    public static RequestPersonJson Build(string name = "Sogro") => new() { Name = name };

    public static RequestPersonChargeJson Charge(decimal amount = 300m, DateOnly? date = null, string description = "Empréstimo em dinheiro") =>
        new() { Description = description, Amount = amount, ChargeDate = date ?? new DateOnly(2026, 12, 10) };

    public static RequestPersonPaymentJson Payment(decimal amount, DateOnly paidOn, params string[] chargeKeys) =>
        new() { Amount = amount, PaidOn = paidOn, ChargeKeys = chargeKeys.Length == 0 ? null : chargeKeys };
}
