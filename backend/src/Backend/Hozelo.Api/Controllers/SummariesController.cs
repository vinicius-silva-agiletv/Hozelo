using Hozelo.Api.Attributes;
using Hozelo.Application.UseCases.Summary.GetMonthly;
using Hozelo.Communication.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Hozelo.Api.Controllers;

[Route("[controller]")]
[ApiController]
[AuthenticatedUser]
[ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status401Unauthorized)]
public class SummariesController : ControllerBase
{
    /// <summary>
    /// Resumo do mês (padrão: mês atual): entradas, saídas, previsto, realizado, pendências de meses anteriores
    /// e saldo acumulado. Com categoryId, só entradas e saídas da categoria (sem acumulado).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ResponseMonthlySummaryJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetMonthly(
        [FromServices] IGetMonthlySummaryUseCase useCase,
        [FromQuery] int? year,
        [FromQuery] int? month,
        [FromQuery] long? categoryId)
    {
        return Ok(await useCase.Execute(year, month, categoryId));
    }
}
