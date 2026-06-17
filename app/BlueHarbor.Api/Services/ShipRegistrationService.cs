using BlueHarbor.Api.Contracts;
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor.Api.Services;

/// <summary>
/// Regola di dominio: registrazione di una nave.
/// La logica vive QUI (non nel controller, non nel frontend), come da architettura.
/// </summary>
public class ShipRegistrationService
{
    private readonly BlueHarborDbContext _db;

    public ShipRegistrationService(BlueHarborDbContext db) => _db = db;

    public async Task<Ship> RegisterAsync(RegisterShipRequest request)
    {
        var state = await _db.AppState.SingleAsync();

        var ship = new Ship
        {
            Name = request.Name.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            Size = request.Size,
            // Congela il giorno d'arrivo: da qui in poi è un giorno virtuale assoluto.
            ArrivalDay = state.CurrentDay + request.ArrivalDayOffset,
            OccupationDays = request.OccupationDays,
            Status = ShipStatus.Pending
        };

        _db.Ships.Add(ship);
        await _db.SaveChangesAsync();
        return ship;
    }
}
