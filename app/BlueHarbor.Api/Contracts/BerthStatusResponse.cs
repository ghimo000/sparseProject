using BlueHarbor.Api.Domain;
using BlueHarbor.Faro;

namespace BlueHarbor.Api.Contracts;

/// <summary>Stato calcolato di una banchina rispetto al giorno virtuale corrente.</summary>
public sealed record BerthStatusResponse(
    string Name,
    ShipSize Size,
    string Status,
    ShipSummary? CurrentShip,
    ShipSummary? NextReservation);

/// <summary>Dati minimi di una nave mostrata dentro la vista banchine.</summary>
public sealed record ShipSummary(
    int Id,
    string Name,
    ShipSize Size,
    int ArrivalDay,
    int OccupationDays,
    string Status)
{
    /// <summary>Ultimo giorno virtuale occupato, utile al frontend per mostrare il periodo.</summary>
    public int EndDay => ArrivalDay + OccupationDays - 1;

    /// <summary>Crea un riepilogo leggibile a partire dall'entita persistita.</summary>
    public static ShipSummary FromShip(Ship ship) =>
        new(
            ship.Id,
            ship.Name,
            ship.Size,
            ship.Assignment?.StartDay ?? ship.RequestedArrivalDay,
            ship.OccupationDays,
            ship.Status.ToString());
}
