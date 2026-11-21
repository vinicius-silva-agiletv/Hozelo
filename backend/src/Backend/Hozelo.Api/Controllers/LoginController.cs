using Hozelo.Application.UseCases.Login.DoLogin;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Hozelo.Api.Controllers;

[Route("[controller]")]
[ApiController]
public class LoginController : ControllerBase
{
    /// <summary>Entra na conta com e-mail e senha.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ResponseRegisteredUserJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Login(
        [FromServices] IDoLoginUseCase useCase,
        [FromBody] RequestLoginJson request)
    {
        var response = await useCase.Execute(request);

        return Ok(response);
    }
}
