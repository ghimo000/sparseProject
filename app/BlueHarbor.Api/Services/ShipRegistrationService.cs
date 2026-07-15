using BlueHarbor.Api.Contracts;
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor.Api.Services;

/// <summary>Registra una nave applicando le regole del dominio.</summary>
public class ShipRegistrationService
{
    private readonly BlueHarborDbContext _db;

    /// <summary>Riceve il database configurato in Program.cs.</summary>
    public ShipRegistrationService(BlueHarborDbContext db) => _db = db;

    /// <summary>Crea una nave Pending partendo da dati gia validati.</summary>
    public async Task<Ship> RegisterAsync(RegisterShipRequest request)
    {
        var state = await _db.AppState.SingleAsync();

        var ship = new Ship
        {
            Name = request.Name.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            Size = request.Size,
            // Salva il giorno assoluto, non l'offset ricevuto dal faro.
            RequestedArrivalDay = state.CurrentDay + request.ArrivalDayOffset,
            OccupationDays = request.OccupationDays,
            Status = ShipStatus.Pending
        };

        _db.Ships.Add(ship);
        await _db.SaveChangesAsync();
        return ship;
    }
}
