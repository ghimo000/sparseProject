namespace BlueHarbor.Faro;

/// <summary>Faro demo: genera arrivi casuali dentro i limiti della commessa.</summary>
public sealed class RandomShipArrivalSource : IShipArrivalSource
{
    private readonly Random _random;

    /// <summary>Usa il generatore casuale condiviso.</summary>
    public RandomShipArrivalSource() : this(Random.Shared) { }

    /// <summary>Permette di usare un Random con seed fisso nei test.</summary>
    public RandomShipArrivalSource(Random random) => _random = random;

    /// <summary>Genera taglia, arrivo e durata di occupazione.</summary>
    public ShipArrival Next()
    {
        var sizes = Enum.GetValues<ShipSize>();
        var size = sizes[_random.Next(sizes.Length)];

        // Il valore massimo di Next e escluso.
        var arrivalDayOffset = _random.Next(0, 31);   // 0..30 inclusi
        var occupationDays = _random.Next(3, 16);     // 3..15 inclusi

        return new ShipArrival(size, arrivalDayOffset, occupationDays);
    }
}
