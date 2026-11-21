using Hozelo.Api.Attributes;
using Hozelo.Application.UseCases.Expense.Amortize;
using Hozelo.Application.UseCases.Expense.Delete;
using Hozelo.Application.UseCases.Expense.GetAll;
using Hozelo.Application.UseCases.Expense.GetById;
using Hozelo.Application.UseCases.Expense.PayInstallment;
using Hozelo.Application.UseCases.Expense.Register;
using Hozelo.Application.UseCases.Expense.UndoInstallmentPayment;
using Hozelo.Application.UseCases.Expense.Update;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Hozelo.Api.Controllers;

[Route("[controller]")]
[ApiController]
[AuthenticatedUser]
[ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status401Unauthorized)]
public class ExpensesController : ControllerBase
{
    /// <summary>Registra uma despesa à vista ou parcelada; as parcelas são geradas pelo sistema.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ResponseExpenseJson), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(
        [FromServices] IRegisterExpenseUseCase useCase,
        [FromBody] RequestRegisterExpenseJson request)
    {
        var response = await useCase.Execute(request);

        return Created(string.Empty, response);
    }

    /// <summary>Lista as despesas com totais; filtros opcionais por categoria e situação (Open/Paid).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ResponseExpensesJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll(
        [FromServices] IGetExpensesUseCase useCase,
        [FromQuery] long? categoryId,
        [FromQuery] string? status)
    {
        return Ok(await useCase.Execute(categoryId, status));
    }

    /// <summary>Detalhe da despesa com todas as parcelas.</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(ResponseExpenseJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromServices] IGetExpenseByIdUseCase useCase, [FromRoute] long id)
    {
        return Ok(await useCase.Execute(id));
    }

    /// <summary>Edita a despesa; mudar valor, parcelas ou data recalcula as parcelas.</summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType(typeof(ResponseExpenseJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        [FromServices] IUpdateExpenseUseCase useCase,
        [FromRoute] long id,
        [FromBody] RequestUpdateExpenseJson request)
    {
        return Ok(await useCase.Execute(id, request));
    }

    /// <summary>Remove a despesa e suas parcelas.</summary>
    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromServices] IDeleteExpenseUseCase useCase, [FromRoute] long id)
    {
        await useCase.Execute(id);

        return NoContent();
    }

    /// <summary>Marca a parcela como paga (padrão: hoje).</summary>
    [HttpPost("{id:long}/installments/{number:int}/payment")]
    [ProducesResponseType(typeof(ResponseExpenseJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PayInstallment(
        [FromServices] IPayInstallmentUseCase useCase,
        [FromRoute] long id,
        [FromRoute] int number,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RequestPayInstallmentJson? request)
    {
        return Ok(await useCase.Execute(id, number, request));
    }

    /// <summary>Desfaz o pagamento da parcela (inclusive de amortização).</summary>
    [HttpDelete("{id:long}/installments/{number:int}/payment")]
    [ProducesResponseType(typeof(ResponseExpenseJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UndoInstallmentPayment(
        [FromServices] IUndoInstallmentPaymentUseCase useCase,
        [FromRoute] long id,
        [FromRoute] int number)
    {
        return Ok(await useCase.Execute(id, number));
    }

    /// <summary>Amortiza: paga parcelas futuras agora, com o valor efetivamente pago.</summary>
    [HttpPost("{id:long}/amortizations")]
    [ProducesResponseType(typeof(ResponseExpenseJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Amortize(
        [FromServices] IAmortizeExpenseUseCase useCase,
        [FromRoute] long id,
        [FromBody] RequestAmortizeExpenseJson request)
    {
        return Ok(await useCase.Execute(id, request));
    }
}
