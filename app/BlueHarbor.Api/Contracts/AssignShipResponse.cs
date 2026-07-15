using BlueHarbor.Api.Domain;

namespace BlueHarbor.Api.Contracts;

/// <summary>Risposta dell'assegnazione nave, con messaggio opzionale per il banner UI.</summary>
public sealed record AssignShipResponse(Ship Ship, bool WasMoved, string? Message);
