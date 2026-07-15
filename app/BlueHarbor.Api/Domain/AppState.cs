namespace BlueHarbor.Api.Domain;

/// <summary>Stato globale: contiene il giorno virtuale corrente.</summary>
public class AppState
{
    public int Id { get; set; }       // sempre 1
    public int CurrentDay { get; set; }
}
