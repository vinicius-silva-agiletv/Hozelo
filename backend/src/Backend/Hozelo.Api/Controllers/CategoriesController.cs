using Hozelo.Api.Attributes;
using Hozelo.Application.UseCases.Category.Delete;
using Hozelo.Application.UseCases.Category.GetAll;
using Hozelo.Application.UseCases.Category.Register;
using Hozelo.Application.UseCases.Category.Update;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Hozelo.Api.Controllers;

[Route("[controller]")]
[ApiController]
[AuthenticatedUser]
[ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status401Unauthorized)]
public class CategoriesController : ControllerBase
{
    /// <summary>Lista as categorias em ordem alfabética (filtro opcional type=Expense|Income), com a quantidade de lançamentos.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ResponseCategoriesJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll([FromServices] IGetCategoriesUseCase useCase, [FromQuery] string? type)
    {
        return Ok(await useCase.Execute(type));
    }

    /// <summary>Cria uma categoria.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ResponseCategoryJson), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(
        [FromServices] IRegisterCategoryUseCase useCase,
        [FromBody] RequestCategoryJson request)
    {
        var response = await useCase.Execute(request);

        return Created(string.Empty, response);
    }

    /// <summary>Renomeia uma categoria.</summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        [FromServices] IUpdateCategoryUseCase useCase,
        [FromRoute] long id,
        [FromBody] RequestCategoryJson request)
    {
        await useCase.Execute(id, request);

        return NoContent();
    }

    /// <summary>Remove uma categoria sem despesas.</summary>
    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete([FromServices] IDeleteCategoryUseCase useCase, [FromRoute] long id)
    {
        await useCase.Execute(id);

        return NoContent();
    }
}
