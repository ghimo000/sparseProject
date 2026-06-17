namespace BlueHarbor.Faro;

/// <summary>
/// Implementazione del Faro che genera arrivi casuali entro i vincoli di commessa:
/// taglia casuale, arrivo entro 30 giorni dal giorno corrente, occupazione 3..15 giorni.
/// </summary>
public sealed class RandomShipArrivalSource : IShipArrivalSource
{
    private readonly Random _random;

    /// <summary>Uso normale: casualità non deterministica.</summary>
    public RandomShipArrivalSource() : this(Random.Shared) { }

    /// <summary>
    /// Per i test: permette di iniettare un <see cref="Random"/> con seed fisso
    /// e ottenere sequenze riproducibili.
    /// </summary>
    public RandomShipArrivalSource(Random random) => _random = random;

    public ShipArrival Next()
    {
        var sizes = Enum.GetValues<ShipSize>();
        var size = sizes[_random.Next(sizes.Length)];

        // Next(min, max) ha max ESCLUSIVO:
        var arrivalDayOffset = _random.Next(0, 31);   // 0..30 inclusi
        var occupationDays = _random.Next(3, 16);     // 3..15 inclusi

        return new ShipArrival(size, arrivalDayOffset, occupationDays);
    }
}
