using Hozelo.Api.Attributes;
using Hozelo.Application.UseCases.Person;
using Hozelo.Application.UseCases.Person.Entries;
using Hozelo.Application.UseCases.Person.Statement;
using Hozelo.Communication.Requests;
using Hozelo.Communication.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Hozelo.Api.Controllers;

/// <summary>Terceiros que devem à família: pessoas, cobranças avulsas, pagamentos, extrato e resumo.</summary>
[Route("[controller]")]
[ApiController]
[AuthenticatedUser]
[ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status401Unauthorized)]
[ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status400BadRequest)]
public class PeopleController : ControllerBase
{
    /// <summary>Pessoas com saldo devedor até hoje e devido no mês atual.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ResponsePeopleJson), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromServices] IPersonUseCase useCase) => Ok(await useCase.GetAll());

    [HttpPost]
    [ProducesResponseType(typeof(ResponsePersonJson), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromServices] IPersonUseCase useCase, [FromBody] RequestPersonJson request) =>
        Created(string.Empty, await useCase.Register(request));

    [HttpPut("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update([FromServices] IPersonUseCase useCase, [FromRoute] long id, [FromBody] RequestPersonJson request)
    {
        await useCase.Update(id, request);
        return NoContent();
    }

    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete([FromServices] IPersonUseCase useCase, [FromRoute] long id)
    {
        await useCase.Delete(id);
        return NoContent();
    }

    /// <summary>Cobrança avulsa (ex.: dinheiro emprestado).</summary>
    [HttpPost("{id:long}/charges")]
    [ProducesResponseType(typeof(ResponsePersonChargeJson), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegisterCharge(
        [FromServices] IPersonEntriesUseCase useCase, [FromRoute] long id, [FromBody] RequestPersonChargeJson request) =>
        Created(string.Empty, await useCase.RegisterCharge(id, request));

    [HttpPut("{id:long}/charges/{chargeId:long}")]
    [ProducesResponseType(typeof(ResponsePersonChargeJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCharge(
        [FromServices] IPersonEntriesUseCase useCase, [FromRoute] long id, [FromRoute] long chargeId, [FromBody] RequestPersonChargeJson request) =>
        Ok(await useCase.UpdateCharge(id, chargeId, request));

    [HttpDelete("{id:long}/charges/{chargeId:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCharge([FromServices] IPersonEntriesUseCase useCase, [FromRoute] long id, [FromRoute] long chargeId)
    {
        await useCase.DeleteCharge(id, chargeId);
        return NoContent();
    }

    /// <summary>Pagamento da pessoa (qualquer valor); chargeKeys opcional escolhe as cobranças quitadas primeiro.</summary>
    [HttpPost("{id:long}/payments")]
    [ProducesResponseType(typeof(ResponsePersonPaymentJson), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegisterPayment(
        [FromServices] IPersonEntriesUseCase useCase, [FromRoute] long id, [FromBody] RequestPersonPaymentJson request) =>
        Created(string.Empty, await useCase.RegisterPayment(id, request));

    [HttpPut("{id:long}/payments/{paymentId:long}")]
    [ProducesResponseType(typeof(ResponsePersonPaymentJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePayment(
        [FromServices] IPersonEntriesUseCase useCase, [FromRoute] long id, [FromRoute] long paymentId, [FromBody] RequestPersonPaymentJson request) =>
        Ok(await useCase.UpdatePayment(id, paymentId, request));

    [HttpDelete("{id:long}/payments/{paymentId:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePayment([FromServices] IPersonEntriesUseCase useCase, [FromRoute] long id, [FromRoute] long paymentId)
    {
        await useCase.DeletePayment(id, paymentId);
        return NoContent();
    }

    /// <summary>Extrato do mês (padrão: atual): saldo anterior, cobranças, pagamentos e saldo que passa adiante.</summary>
    [HttpGet("{id:long}/statement")]
    [ProducesResponseType(typeof(ResponsePersonStatementJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Statement(
        [FromServices] IPersonStatementUseCase useCase, [FromRoute] long id, [FromQuery] int? year, [FromQuery] int? month) =>
        Ok(await useCase.Statement(id, year, month));

    /// <summary>Resumo geral por compra/origem: parcelas, total, pago e quanto falta.</summary>
    [HttpGet("{id:long}/summary")]
    [ProducesResponseType(typeof(ResponsePersonOverviewJson), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ResponseErrorJson), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Summary([FromServices] IPersonStatementUseCase useCase, [FromRoute] long id) =>
        Ok(await useCase.Summary(id));
}
