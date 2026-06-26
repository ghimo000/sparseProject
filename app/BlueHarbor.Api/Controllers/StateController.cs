using BlueHarbor.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BlueHarbor.Api.Controllers;

[ApiController]
[Route("api/state")]
public class StateController : ControllerBase
{
    private readonly VirtualTimeService _time;

    public StateController(VirtualTimeService time) => _time = time;

    /// <summary>Giorno virtuale corrente.</summary>
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        return Ok(await _time.GetStateAsync());
    }

    /// <summary>Avanza il giorno virtuale di una unità.</summary>
    [HttpPost("next-day")]
    public async Task<IActionResult> NextDay()
    {
        return Ok(await _time.AdvanceOneDayAsync());
    }
}
