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

    /// <summary>Assegna una nave Pending alla banchina scelta dallo Scheduler, al primo slot libero su di essa.</summary>
    public async Task<AssignShipResponse?> AssignAsync(int shipId, string berthName)
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

        var berth = Berth.All.FirstOrDefault(b => b.Name == berthName);

        if (berth is null || berth.Size != ship.Size)
        {
            throw new InvalidOperationException("La banchina scelta non e compatibile con la taglia della nave.");
        }

        var requestedDay = ship.RequestedArrivalDay;
        var assignedShips = await GetAssignedShipsAsync();
        var startDay = FindFirstAvailableSlotForBerth(berth, ship, assignedShips);

        ship.Assignment = new BerthAssignment
        {
            ShipId = ship.Id,
            BerthName = berth.Name,
            StartDay = startDay
        };
        ship.Status = ShipStatus.Assigned;

        await _db.SaveChangesAsync();

        var wasMoved = startDay != requestedDay;
        return new AssignShipResponse(ship, wasMoved, wasMoved ? MovedMessage : null);
    }

    /// <summary>Elenca le banchine compatibili per taglia con una nave Pending, indicando se e quando sono libere.</summary>
    public async Task<IReadOnlyList<AvailableBerthResponse>?> GetAvailableBerthsForShipAsync(int shipId)
    {
        var ship = await _db.Ships.Include(s => s.Assignment).FirstOrDefaultAsync(s => s.Id == shipId);

        if (ship is null || ship.Status != ShipStatus.Pending)
        {
            return null;
        }

        var assignedShips = await GetAssignedShipsAsync();

        return Berth.All
            .Where(berth => berth.Size == ship.Size)
            .Select(berth =>
            {
                var freeAtRequestedDay = IsBerthFree(berth.Name, ship.RequestedArrivalDay, ship.OccupationDays, assignedShips);
                var nextFreeDay = freeAtRequestedDay
                    ? ship.RequestedArrivalDay
                    : FindFirstAvailableSlotForBerth(berth, ship, assignedShips);

                return new AvailableBerthResponse(berth.Name, berth.Size, freeAtRequestedDay, nextFreeDay);
            })
            .ToList();
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

    private static int FindFirstAvailableSlotForBerth(Berth berth, Ship ship, IReadOnlyList<Ship> assignedShips)
    {
        for (var startDay = ship.RequestedArrivalDay; startDay < ship.RequestedArrivalDay + 10000; startDay++)
        {
            if (IsBerthFree(berth.Name, startDay, ship.OccupationDays, assignedShips))
            {
                return startDay;
            }
        }

        throw new InvalidOperationException("Nessuno slot disponibile trovato su questa banchina.");
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
}
