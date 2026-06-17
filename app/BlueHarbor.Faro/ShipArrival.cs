namespace BlueHarbor.Faro;

/// <summary>
/// Dati grezzi di un singolo arrivo, prodotti dal Faro.
///
/// NON contiene: nome/note (li aggiunge l'Operatore), id o persistenza
/// (li gestisce BlueHarbor), stato (lo imposta BlueHarbor a Pending),
/// banchina/assegnazione (decide lo Scheduler più avanti).
///
/// È un semplice oggetto C#: il JSON, se serve, nasce solo al confine HTTP.
/// </summary>
/// <param name="Size">Dimensione casuale della nave.</param>
/// <param name="ArrivalDayOffset">
/// Giorni rispetto al giorno corrente di BlueHarbor (0..30 inclusi).
/// È un offset, non una data: l'orologio appartiene a BlueHarbor, non al faro.
/// </param>
/// <param name="OccupationDays">Durata di occupazione della banchina (3..15 inclusi).</param>
public record ShipArrival(
    ShipSize Size,
    int ArrivalDayOffset,
    int OccupationDays
);
