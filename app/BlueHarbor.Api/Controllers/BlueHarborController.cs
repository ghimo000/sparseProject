using BlueHarbor.Api.Contracts;
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Services;
using BlueHarbor.Faro;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor.Api.Controllers;

/// <summary>
/// Espone le API usate dal frontend.
/// La logica di dominio resta nei service.
/// </summary>
[ApiController]
public class BlueHarborController : ControllerBase
{
    private readonly BlueHarborDbContext _db;
    private readonly IShipArrivalSource _faro;
    private readonly ShipRegistrationService _registration;
    private readonly DayService _days;
    private readonly BerthSchedulerService _berths;

    /// <summary>Riceve da ASP.NET gli oggetti configurati in Program.cs.</summary>
    public BlueHarborController(
        BlueHarborDbContext db,
        IShipArrivalSource faro,
        ShipRegistrationService registration,
        DayService days,
        BerthSchedulerService berths)
    {
        _db = db;
        _faro = faro;
        _registration = registration;
        _days = days;
        _berths = berths;
    }

    /// <summary>GET /api/state: ritorna giorno virtuale e data fittizia.</summary>
    [HttpGet("api/state")]
    public async Task<IActionResult> GetState()
    {
        var state = await _days.GetStateAsync();
        return Ok(state);
    }

    /// <summary>POST /api/state/next-day: avanza il giorno virtuale di uno.</summary>
    [HttpPost("api/state/next-day")]
    public async Task<IActionResult> NextDay()
    {
        var state = await _days.NextDayAsync();
        return Ok(state);
    }

    /// <summary>POST /api/arrivals: genera un arrivo senza salvarlo.</summary>
    [HttpPost("api/arrivals")]
    public ActionResult<ShipArrival> GenerateArrival()
    {
        var arrival = _faro.Next();
        return Ok(arrival);
    }

    /// <summary>GET /api/ships: ritorna le navi ordinate per arrivo.</summary>
    [HttpGet("api/ships")]
    public async Task<IActionResult> GetShips()
    {
        var ships = await _db.Ships
            .Include(ship => ship.Assignment)
            .Select(ship => new
            {
                ship.Id,
                ship.Name,
                ship.Notes,
                ship.Size,
                ArrivalDay = ship.Assignment != null ? ship.Assignment.StartDay : ship.RequestedArrivalDay,
                ship.OccupationDays,
                BerthName = ship.Assignment != null ? ship.Assignment.BerthName : null,
                ship.Status
            })
            .OrderBy(ship => ship.ArrivalDay)
            .ThenBy(ship => ship.BerthName)
            .ToListAsync();

        return Ok(ships);
    }

    /// <summary>GET /api/berths: ritorna stato attuale e prossime prenotazioni delle banchine.</summary>
    [HttpGet("api/berths")]
    public async Task<IActionResult> GetBerths()
    {
        var berths = await _berths.GetBerthStatusesAsync();
        return Ok(berths);
    }

    /// <summary>POST /api/ships: registra una nave in stato Pending.</summary>
    [HttpPost("api/ships")]
    public async Task<IActionResult> RegisterShip([FromBody] RegisterShipRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            ModelState.AddModelError(nameof(request.Name), "Il nome e obbligatorio.");
            return ValidationProblem(ModelState);
        }

        var ship = await _registration.RegisterAsync(request);
        return Ok(ship);
    }

    /// <summary>POST /api/ships/{id}/assign: assegna una nave Pending a una banchina.</summary>
    [HttpPost("api/ships/{id:int}/assign")]
    public async Task<IActionResult> AssignShip(int id)
    {
        try
        {
            var result = await _berths.AssignAsync(id);

            if (result is null)
            {
                return NotFound();
            }

            return Ok(result);
        }
        catch (InvalidOperationException error)
        {
            return BadRequest(new { message = error.Message });
        }
    }

    /// <summary>DELETE /api/ships/{id}: cancella una nave e libera l'eventuale banchina assegnata.</summary>
    [HttpDelete("api/ships/{id:int}")]
    public async Task<IActionResult> DeleteShip(int id)
    {
        var ship = await _db.Ships.FindAsync(id);

        if (ship is null)
        {
            return NotFound();
        }

        _db.Ships.Remove(ship);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
