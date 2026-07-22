namespace BlueHarbor.Api.Contracts;

/// <summary>Banchina scelta dallo Scheduler per assegnare una nave Pending.</summary>
public sealed record AssignShipRequest(string BerthName);
