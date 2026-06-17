using BlueHarbor.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor.Api.Controllers;

[ApiController]
[Route("api/state")]
public class StateController : ControllerBase
{
    private readonly BlueHarborDbContext _db;

    public StateController(BlueHarborDbContext db) => _db = db;

    /// <summary>Giorno virtuale corrente.</summary>
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var state = await _db.AppState.SingleAsync();
        return Ok(new { currentDay = state.CurrentDay });
    }
}
