using BlueHarbor.Faro;
using Microsoft.AspNetCore.Mvc;

namespace BlueHarbor.Api.Controllers;

[ApiController]
[Route("api/arrivals")]
public class ArrivalsController : ControllerBase
{
    private readonly IShipArrivalSource _faro;

    public ArrivalsController(IShipArrivalSource faro) => _faro = faro;

    /// <summary>
    /// Il faro genera un nuovo arrivo (anteprima). Nessun salvataggio:
    /// la nave nasce solo quando l'Operatore conferma con i metadati.
    /// </summary>
    [HttpPost]
    public ActionResult<ShipArrival> Generate() => Ok(_faro.Next());
}
