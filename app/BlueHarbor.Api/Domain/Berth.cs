using BlueHarbor.Faro;

namespace BlueHarbor.Api.Domain;

/// <summary>Banchina del terminal. L'elenco e fisso, quindi non serve una tabella dedicata.</summary>
public sealed record Berth(string Name, ShipSize Size)
{
    /// <summary>Banchine disponibili, nell'ordine usato dallo Scheduler per scegliere.</summary>
    public static readonly IReadOnlyList<Berth> All =
    [
        new("XL-1", ShipSize.XL),
        new("L-1", ShipSize.L),
        new("M-1", ShipSize.M),
        new("M-2", ShipSize.M),
        new("S-1", ShipSize.S),
        new("S-2", ShipSize.S),
        new("S-3", ShipSize.S),
        new("S-4", ShipSize.S)
    ];
}
