using Hozelo.Api.Attributes;
using Hozelo.Application.UseCases.OpeningBalance;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Hozelo.Api.Controllers;

/// <summary>Saldo inicial do acumulado. Rota no singular: recurso único por conta (plan.md, Complexity Tracking).</summary>
[Route("opening-balance")]
[ApiController]
[AuthenticatedUser]
[ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status401Unauthorized)]
public class OpeningBalanceController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ResponseOpeningBalanceJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get([FromServices] IOpeningBalanceUseCase useCase)
    {
        return Ok(await useCase.Get());
    }

    /// <summary>Cria ou altera o saldo inicial (valor pode ser negativo).</summary>
    [HttpPut]
    [ProducesResponseType(typeof(ResponseOpeningBalanceJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Set([FromServices] IOpeningBalanceUseCase useCase, [FromBody] RequestOpeningBalanceJson request)
    {
        return Ok(await useCase.Set(request));
    }
}
