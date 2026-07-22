using BlueHarbor.Faro;

namespace BlueHarbor.Api.Contracts;

/// <summary>Banchina compatibile per taglia con una nave Pending, con indicazione di quando e libera.</summary>
public sealed record AvailableBerthResponse(
    string Name,
    ShipSize Size,
    bool FreeAtRequestedDay,
    int NextFreeDay);
