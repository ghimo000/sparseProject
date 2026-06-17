namespace BlueHarbor.Api.Domain;

/// <summary>
/// Ciclo di vita minimale di una nave (da commessa):
/// Pending → Assigned → Departed.
/// </summary>
public enum ShipStatus
{
    Pending,
    Assigned,
    Departed
}
