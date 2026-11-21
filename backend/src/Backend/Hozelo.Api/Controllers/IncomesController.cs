using Hozelo.Api.Attributes;
using Hozelo.Application.UseCases.Income.Delete;
using Hozelo.Application.UseCases.Income.GetAll;
using Hozelo.Application.UseCases.Income.GetById;
using Hozelo.Application.UseCases.Income.Receive;
using Hozelo.Application.UseCases.Income.Register;
using Hozelo.Application.UseCases.Income.Update;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Hozelo.Api.Controllers;

[Route("[controller]")]
[ApiController]
[AuthenticatedUser]
[ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status401Unauthorized)]
public class IncomesController : ControllerBase
{
    /// <summary>Registra uma receita avulsa (prevista ou já recebida).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ResponseIncomeJson), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromServices] IRegisterIncomeUseCase useCase, [FromBody] RequestIncomeJson request)
    {
        return Created(string.Empty, await useCase.Execute(request));
    }

    /// <summary>Lista receitas avulsas (filtros opcionais: categoryId; year e month juntos).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ResponseIncomesJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll(
        [FromServices] IGetIncomesUseCase useCase,
        [FromQuery] long? categoryId,
        [FromQuery] int? year,
        [FromQuery] int? month)
    {
        return Ok(await useCase.Execute(categoryId, year, month));
    }

    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(ResponseIncomeJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromServices] IGetIncomeByIdUseCase useCase, [FromRoute] long id)
    {
        return Ok(await useCase.Execute(id));
    }

    [HttpPut("{id:long}")]
    [ProducesResponseType(typeof(ResponseIncomeJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        [FromServices] IUpdateIncomeUseCase useCase, [FromRoute] long id, [FromBody] RequestUpdateIncomeJson request)
    {
        return Ok(await useCase.Execute(id, request));
    }

    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromServices] IDeleteIncomeUseCase useCase, [FromRoute] long id)
    {
        await useCase.Execute(id);
        return NoContent();
    }

    /// <summary>Confirma o recebimento (padrão: hoje).</summary>
    [HttpPost("{id:long}/receipt")]
    [ProducesResponseType(typeof(ResponseIncomeJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Receive(
        [FromServices] IReceiveIncomeUseCase useCase,
        [FromRoute] long id,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RequestReceiveIncomeJson? request)
    {
        return Ok(await useCase.Execute(id, request));
    }

    /// <summary>Desfaz o recebimento.</summary>
    [HttpDelete("{id:long}/receipt")]
    [ProducesResponseType(typeof(ResponseIncomeJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UndoReceipt([FromServices] IReceiveIncomeUseCase useCase, [FromRoute] long id)
    {
        return Ok(await useCase.Undo(id));
    }
}
