using Hozelo.Api.Attributes;
using Hozelo.Application.UseCases.Recurrence.Delete;
using Hozelo.Application.UseCases.Recurrence.Get;
using Hozelo.Application.UseCases.Recurrence.Months;
using Hozelo.Application.UseCases.Recurrence.Period;
using Hozelo.Application.UseCases.Recurrence.Register;
using Hozelo.Application.UseCases.Recurrence.Update;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Hozelo.Api.Controllers;

/// <summary>Receitas recorrentes (salário) e contas fixas (internet, luz), conforme o campo kind.</summary>
[Route("[controller]")]
[ApiController]
[AuthenticatedUser]
[ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status401Unauthorized)]
[ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
public class RecurrencesController : ControllerBase
{
    private const string MonthRoute = "{id:long}/months/{year:int}/{month:int}";

    [HttpPost]
    [ProducesResponseType(typeof(ResponseRecurrenceJson), StatusCodes.Status201Created)]
    public async Task<IActionResult> Register([FromServices] IRegisterRecurrenceUseCase useCase, [FromBody] RequestRecurrenceJson request)
    {
        return Created(string.Empty, await useCase.Execute(request));
    }

    /// <summary>Lista recorrências (filtros opcionais: kind=Expense|Income, categoryId).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ResponseRecurrencesJson), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromServices] IGetRecurrencesUseCase useCase, [FromQuery] string? kind, [FromQuery] long? categoryId)
    {
        return Ok(await useCase.GetAll(kind, categoryId));
    }

    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(ResponseRecurrenceJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromServices] IGetRecurrencesUseCase useCase, [FromRoute] long id)
    {
        return Ok(await useCase.GetById(id));
    }

    [HttpPut("{id:long}")]
    [ProducesResponseType(typeof(ResponseRecurrenceJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        [FromServices] IUpdateRecurrenceUseCase useCase, [FromRoute] long id, [FromBody] RequestUpdateRecurrenceJson request)
    {
        return Ok(await useCase.Execute(id, request));
    }

    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromServices] IDeleteRecurrenceUseCase useCase, [FromRoute] long id)
    {
        await useCase.Execute(id);
        return NoContent();
    }

    /// <summary>Muda o valor a partir de um mês (meses já confirmados não mudam).</summary>
    [HttpPut("{id:long}/amount")]
    [ProducesResponseType(typeof(ResponseRecurrenceJson), StatusCodes.Status200OK)]
    public async Task<IActionResult> ChangeAmount(
        [FromServices] IRecurrencePeriodUseCase useCase, [FromRoute] long id, [FromBody] RequestChangeRecurrenceAmountJson request)
    {
        return Ok(await useCase.ChangeAmount(id, request));
    }

    /// <summary>Encerra no mês informado (último mês da recorrência).</summary>
    [HttpPut("{id:long}/end")]
    [ProducesResponseType(typeof(ResponseRecurrenceJson), StatusCodes.Status200OK)]
    public async Task<IActionResult> End(
        [FromServices] IRecurrencePeriodUseCase useCase, [FromRoute] long id, [FromBody] RequestEndRecurrenceJson request)
    {
        return Ok(await useCase.End(id, request));
    }

    /// <summary>Reabre (remove o mês final).</summary>
    [HttpDelete("{id:long}/end")]
    [ProducesResponseType(typeof(ResponseRecurrenceJson), StatusCodes.Status200OK)]
    public async Task<IActionResult> Reopen([FromServices] IRecurrencePeriodUseCase useCase, [FromRoute] long id)
    {
        return Ok(await useCase.Reopen(id));
    }

    /// <summary>Ajusta o valor de um mês ou marca o mês como pulado.</summary>
    [HttpPut(MonthRoute)]
    [ProducesResponseType(typeof(ResponseRecurrenceJson), StatusCodes.Status200OK)]
    public async Task<IActionResult> AdjustMonth(
        [FromServices] IRecurrenceMonthUseCase useCase,
        [FromRoute] long id, [FromRoute] int year, [FromRoute] int month,
        [FromBody] RequestAdjustRecurrenceMonthJson request)
    {
        return Ok(await useCase.Adjust(id, year, month, request));
    }

    /// <summary>Desfaz ajuste ou pulo do mês (mantém a confirmação).</summary>
    [HttpDelete(MonthRoute)]
    [ProducesResponseType(typeof(ResponseRecurrenceJson), StatusCodes.Status200OK)]
    public async Task<IActionResult> UndoMonthAdjustment(
        [FromServices] IRecurrenceMonthUseCase useCase, [FromRoute] long id, [FromRoute] int year, [FromRoute] int month)
    {
        return Ok(await useCase.UndoAdjustment(id, year, month));
    }

    /// <summary>Confirma o recebimento (receita) ou pagamento (conta fixa) do mês (padrão: hoje).</summary>
    [HttpPost(MonthRoute + "/settlement")]
    [ProducesResponseType(typeof(ResponseRecurrenceJson), StatusCodes.Status200OK)]
    public async Task<IActionResult> SettleMonth(
        [FromServices] IRecurrenceMonthUseCase useCase,
        [FromRoute] long id, [FromRoute] int year, [FromRoute] int month,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RequestSettleRecurrenceMonthJson? request)
    {
        return Ok(await useCase.Settle(id, year, month, request));
    }

    /// <summary>Desfaz a confirmação do mês.</summary>
    [HttpDelete(MonthRoute + "/settlement")]
    [ProducesResponseType(typeof(ResponseRecurrenceJson), StatusCodes.Status200OK)]
    public async Task<IActionResult> UndoMonthSettlement(
        [FromServices] IRecurrenceMonthUseCase useCase, [FromRoute] long id, [FromRoute] int year, [FromRoute] int month)
    {
        return Ok(await useCase.UndoSettlement(id, year, month));
    }
}
