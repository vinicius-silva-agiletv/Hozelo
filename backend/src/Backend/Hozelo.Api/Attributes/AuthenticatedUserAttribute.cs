using Hozelo.Api.Filters;
using Microsoft.AspNetCore.Mvc;

namespace Hozelo.Api.Attributes;

/// <summary>Marca a action/controller como exclusiva da conta autenticada.</summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class AuthenticatedUserAttribute() : TypeFilterAttribute(typeof(AuthenticatedUserFilter));
