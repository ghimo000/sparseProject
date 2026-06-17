namespace BlueHarbor.Api.Domain;

/// <summary>
/// Stato globale dell'applicazione: una sola riga (Id = 1).
/// Tiene il giorno virtuale corrente. L'azione Next Day (slice futura)
/// incrementerà questo valore.
/// </summary>
public class AppState
{
    public int Id { get; set; }       // sempre 1
    public int CurrentDay { get; set; }
}
