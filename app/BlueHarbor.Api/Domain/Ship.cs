using BlueHarbor.Faro;

namespace BlueHarbor.Api.Domain;

/// <summary>Nave registrata dentro BlueHarbor.</summary>
public class Ship
{
    public int Id { get; set; }

    /// <summary>Nome inserito dall'Operatore.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Note opzionali inserite dall'Operatore.</summary>
    public string? Notes { get; set; }

    /// <summary>Dimensione ricevuta dal faro.</summary>
    public ShipSize Size { get; set; }

    /// <summary>Giorno virtuale richiesto all'arrivo, impostato alla registrazione e mai modificato.</summary>
    public int RequestedArrivalDay { get; set; }

    /// <summary>Giorni di occupazione della banchina.</summary>
    public int OccupationDays { get; set; }

    /// <summary>Stato corrente della nave.</summary>
    public ShipStatus Status { get; set; } = ShipStatus.Pending;

    /// <summary>Assegnazione a banchina, presente solo quando la nave non e piu Pending.</summary>
    public BerthAssignment? Assignment { get; set; }

    /// <summary>Nascosta dallo storico dello Scheduler. Non influisce sul calendario ne sullo storico dell'Operatore.</summary>
    public bool HiddenFromSchedulerHistory { get; set; }

    /// <summary>Nascosta dallo storico dell'Operatore. Non influisce sul calendario ne sullo storico dello Scheduler.</summary>
    public bool HiddenFromOperatorHistory { get; set; }
}
