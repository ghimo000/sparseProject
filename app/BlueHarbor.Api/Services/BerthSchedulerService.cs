using BlueHarbor.Api.Contracts;
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor.Api.Services;

/// <summary>Applica le regole di assegnazione delle navi alle banchine.</summary>
public class BerthSchedulerService
{
    private const string MovedMessage =
        "Banchina occupata nella finestra richiesta: nave assegnata al primo slot libero.";

    private readonly BlueHarborDbContext _db;

    /// <summary>Riceve il database configurato in Program.cs.</summary>
    public BerthSchedulerService(BlueHarborDbContext db) => _db = db;

    /// <summary>Calcola lo stato corrente e la prossima prenotazione per ogni banchina.</summary>
    public async Task<IReadOnlyList<BerthStatusResponse>> GetBerthStatusesAsync()
    {
        var currentDay = (await _db.AppState.SingleAsync()).CurrentDay;
        var assignedShips = await GetAssignedShipsAsync();

        return Berth.All
            .Select(berth => ToBerthStatus(berth, assignedShips, currentDay))
            .ToList();
    }

    /// <summary>Assegna una nave Pending alla prima banchina e finestra disponibili.</summary>
    public async Task<AssignShipResponse?> AssignAsync(int shipId)
    {
        var ship = await _db.Ships.Include(s => s.Assignment).FirstOrDefaultAsync(s => s.Id == shipId);

        if (ship is null)
        {
            return null;
        }

        if (ship.Status != ShipStatus.Pending)
        {
            throw new InvalidOperationException("Solo le navi Pending possono essere assegnate.");
        }

        var requestedDay = ship.RequestedArrivalDay;
        var assignedShips = await GetAssignedShipsAsync();
        var slot = FindFirstAvailableSlot(ship, assignedShips);

        ship.Assignment = new BerthAssignment
        {
            ShipId = ship.Id,
            BerthName = slot.BerthName,
            StartDay = slot.StartDay
        };
        ship.Status = ShipStatus.Assigned;

        await _db.SaveChangesAsync();

        var wasMoved = slot.StartDay != requestedDay;
        return new AssignShipResponse(ship, wasMoved, wasMoved ? MovedMessage : null);
    }

    private static BerthStatusResponse ToBerthStatus(
        Berth berth,
        IReadOnlyList<Ship> assignedShips,
        int currentDay)
    {
        var berthShips = assignedShips
            .Where(ship => ship.Assignment!.BerthName == berth.Name)
            .OrderBy(ship => ship.Assignment!.StartDay)
            .ToList();

        var currentShip = berthShips.FirstOrDefault(ship =>
            ship.Assignment!.StartDay <= currentDay &&
            currentDay < ship.Assignment!.StartDay + ship.OccupationDays);

        var nextReservation = berthShips.FirstOrDefault(ship => currentDay < ship.Assignment!.StartDay);

        return new BerthStatusResponse(
            berth.Name,
            berth.Size,
            currentShip is null ? "Free" : "Occupied",
            currentShip is null ? null : ShipSummary.FromShip(currentShip),
            nextReservation is null ? null : ShipSummary.FromShip(nextReservation));
    }

    private Assignment FindFirstAvailableSlot(Ship ship, IReadOnlyList<Ship> assignedShips)
    {
        var compatibleBerths = Berth.All
            .Where(berth => berth.Size == ship.Size)
            .ToList();

        for (var startDay = ship.RequestedArrivalDay; startDay < ship.RequestedArrivalDay + 10000; startDay++)
        {
            foreach (var berth in compatibleBerths)
            {
                if (IsBerthFree(berth.Name, startDay, ship.OccupationDays, assignedShips))
                {
                    return new Assignment(berth.Name, startDay);
                }
            }
        }

        throw new InvalidOperationException("Nessuno slot disponibile trovato.");
    }

    private static bool IsBerthFree(
        string berthName,
        int startDay,
        int occupationDays,
        IReadOnlyList<Ship> assignedShips)
    {
        var endDay = startDay + occupationDays;

        return assignedShips
            .Where(ship => ship.Assignment!.BerthName == berthName)
            .All(ship => !WindowsOverlap(startDay, endDay, ship.Assignment!.StartDay, ship.Assignment!.StartDay + ship.OccupationDays));
    }

    private static bool WindowsOverlap(int startA, int endA, int startB, int endB) =>
        startA < endB && startB < endA;

    private Task<List<Ship>> GetAssignedShipsAsync() =>
        _db.Ships
            .Include(ship => ship.Assignment)
            .Where(ship => ship.Status == ShipStatus.Assigned && ship.Assignment != null)
            .OrderBy(ship => ship.Assignment!.StartDay)
            .ToListAsync();

    private sealed record Assignment(string BerthName, int StartDay);
}
