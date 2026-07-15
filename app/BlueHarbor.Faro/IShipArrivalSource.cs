namespace BlueHarbor.Faro;

/// <summary>Contratto del faro: produce nuovi arrivi nave.</summary>
public interface IShipArrivalSource
{
    /// <summary>Genera i dati di un nuovo arrivo.</summary>
    ShipArrival Next();
}
