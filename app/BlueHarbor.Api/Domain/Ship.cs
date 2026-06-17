using BlueHarbor.Faro;

namespace BlueHarbor.Api.Domain;

/// <summary>
/// Nave registrata in BlueHarbor: nasce dai dati del faro + i metadati dell'Operatore.
/// </summary>
public class Ship
{
    public int Id { get; set; }

    /// <summary>Metadato inserito dall'Operatore.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Metadato opzionale inserito dall'Operatore.</summary>
    public string? Notes { get; set; }

    /// <summary>Dato dal faro.</summary>
    public ShipSize Size { get; set; }

    /// <summary>
    /// Giorno virtuale ASSOLUTO di arrivo, congelato alla registrazione
    /// (giornoCorrente + offset del faro).
    /// </summary>
    public int ArrivalDay { get; set; }

    /// <summary>Dato dal faro: durata di occupazione della banchina.</summary>
    public int OccupationDays { get; set; }

    public ShipStatus Status { get; set; } = ShipStatus.Pending;
}
