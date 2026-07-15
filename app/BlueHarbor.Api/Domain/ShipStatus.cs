namespace BlueHarbor.Api.Domain;

/// <summary>Ciclo di vita minimo di una nave: Pending -> Assigned -> Departed.</summary>
public enum ShipStatus
{
    Pending,
    Assigned,
    Departed
}
