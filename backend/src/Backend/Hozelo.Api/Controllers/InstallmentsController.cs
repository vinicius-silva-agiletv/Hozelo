using Hozelo.Api.Attributes;
using Hozelo.Application.UseCases.Installment.GetMonthly;
using Hozelo.Communication.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Hozelo.Api.Controllers;

[Route("[controller]")]
[ApiController]
[AuthenticatedUser]
[ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status401Unauthorized)]
public class InstallmentsController : ControllerBase
{
    /// <summary>Visão mensal: parcelas do mês (padrão: mês atual) com totais.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ResponseMonthlyInstallmentsJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetMonthly(
        [FromServices] IGetMonthlyInstallmentsUseCase useCase,
        [FromQuery] int? year,
        [FromQuery] int? month,
        [FromQuery] long? categoryId)
    {
        return Ok(await useCase.Execute(year, month, categoryId));
    }
}
