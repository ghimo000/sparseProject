using BlueHarbor.Api.Contracts;
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor.Api.Controllers;

[ApiController]
[Route("api/ships")]
public class ShipsController : ControllerBase
{
    private readonly BlueHarborDbContext _db;
    private readonly ShipRegistrationService _registration;

    public ShipsController(BlueHarborDbContext db, ShipRegistrationService registration)
    {
        _db = db;
        _registration = registration;
    }

    /// <summary>Elenco navi (per ora tutte), ordinate per giorno di arrivo.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var ships = await _db.Ships.OrderBy(s => s.ArrivalDay).ToListAsync();
        return Ok(ships);
    }

    /// <summary>Registra una nuova nave in stato Pending.</summary>
    [HttpPost]
    public async Task<IActionResult> Register([FromBody] RegisterShipRequest request)
    {
        // [ApiController] ha già validato i range/required e risposto 400 se invalido.
        var ship = await _registration.RegisterAsync(request);
        return CreatedAtAction(nameof(GetAll), new { id = ship.Id }, ship);
    }
}
