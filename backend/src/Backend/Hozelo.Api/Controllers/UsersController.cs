using Hozelo.Api.Attributes;
using Hozelo.Application.UseCases.User.Profile;
using Hozelo.Application.UseCases.User.Register;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Hozelo.Api.Controllers;

[Route("[controller]")]
[ApiController]
public class UsersController : ControllerBase
{
    /// <summary>Cria a conta da família. Só é permitido enquanto não existe nenhuma conta.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ResponseRegisteredUserJson), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(
        [FromServices] IRegisterUserUseCase useCase,
        [FromBody] RequestRegisterUserJson request)
    {
        var response = await useCase.Execute(request);

        return Created(string.Empty, response);
    }

    /// <summary>Devolve nome e e-mail da conta autenticada.</summary>
    [HttpGet]
    [AuthenticatedUser]
    [ProducesResponseType(typeof(ResponseUserProfileJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProfile([FromServices] IGetUserProfileUseCase useCase)
    {
        var response = await useCase.Execute();

        return Ok(response);
    }
}
