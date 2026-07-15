using System.Globalization;
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor.Api.Services;

/// <summary>Gestisce il giorno virtuale di BlueHarbor.</summary>
public class DayService
{
    private static readonly DateOnly BaseDate = new(2026, 6, 1);
    private readonly BlueHarborDbContext _db;

    /// <summary>Riceve il database configurato in Program.cs.</summary>
    public DayService(BlueHarborDbContext db) => _db = db;

    /// <summary>Legge giorno virtuale e data fittizia mostrata agli utenti.</summary>
    public async Task<DayState> GetStateAsync()
    {
        var state = await _db.AppState.SingleAsync();
        return ToDayState(state.CurrentDay);
    }

    /// <summary>Avanza il giorno virtuale di una unita.</summary>
    public async Task<DayState> NextDayAsync()
    {
        var state = await _db.AppState.SingleAsync();
        state.CurrentDay += 1;

        MarkDepartedShips(state.CurrentDay);

        await _db.SaveChangesAsync();
        return ToDayState(state.CurrentDay);
    }

    private static DayState ToDayState(int currentDay)
    {
        var currentDate = BaseDate.AddDays(currentDay);
        return new DayState(
            currentDay,
            currentDate.ToString("dd-MM-yyyy", CultureInfo.InvariantCulture));
    }

    private void MarkDepartedShips(int currentDay)
    {
        var completedShips = _db.Ships
            .Include(ship => ship.Assignment)
            .Where(ship =>
                ship.Status == ShipStatus.Assigned &&
                ship.Assignment != null &&
                currentDay >= ship.Assignment.StartDay + ship.OccupationDays);

        foreach (var ship in completedShips)
        {
            ship.Status = ShipStatus.Departed;
        }
    }
}

/// <summary>Risposta con giorno virtuale e data fittizia.</summary>
public record DayState(int CurrentDay, string CurrentDate);
