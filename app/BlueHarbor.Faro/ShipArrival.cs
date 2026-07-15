namespace BlueHarbor.Faro;

/// <summary>Dati grezzi di un arrivo prodotto dal faro.</summary>
/// <param name="Size">Dimensione della nave.</param>
/// <param name="ArrivalDayOffset">Giorni da aggiungere al giorno virtuale corrente.</param>
/// <param name="OccupationDays">Giorni di occupazione della banchina.</param>
public record ShipArrival(
    ShipSize Size,
    int ArrivalDayOffset,
    int OccupationDays
);
