namespace BlueHarbor.Faro;

/// <summary>
/// Sorgente di arrivi navi: il "Faro".
///
/// Astrae DA DOVE arrivano i dati. Oggi: un generatore casuale interno
/// (<see cref="RandomShipArrivalSource"/>). Domani, eventualmente, un sistema
/// esterno via HTTP: basterebbe una nuova implementazione di questa interfaccia,
/// senza toccare il dominio di BlueHarbor.
/// </summary>
public interface IShipArrivalSource
{
    /// <summary>Produce i dati di un nuovo arrivo.</summary>
    ShipArrival Next();
}
