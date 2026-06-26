using BlueHarbor.Api.Contracts;
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor.Api.Services;

/// <summary>
/// Regola di dominio: avanzamento del giorno virtuale.
/// Il sistema non è real-time: il tempo cambia solo tramite Next Day.
/// </summary>
public class VirtualTimeService
{
    private static readonly DateOnly BaseDate = new(2026, 6, 26);
    private readonly BlueHarborDbContext _db;

    public VirtualTimeService(BlueHarborDbContext db) => _db = db;

    public async Task<StateResponse> GetStateAsync()
    {
        var state = await _db.AppState.SingleAsync();
        return ToResponse(state);
    }

    public async Task<StateResponse> AdvanceOneDayAsync()
    {
        var state = await _db.AppState.SingleAsync();
        state.CurrentDay += 1;
        await _db.SaveChangesAsync();
        return ToResponse(state);
    }

    private static StateResponse ToResponse(AppState state)
    {
        return new StateResponse(state.CurrentDay, BaseDate.AddDays(state.CurrentDay));
    }
}
