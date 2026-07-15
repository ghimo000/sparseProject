using System.Text.Json.Serialization;

namespace BlueHarbor.Api.Domain;

/// <summary>Assegnazione di una nave a una banchina. Creata una sola volta, mai riassegnata.</summary>
public class BerthAssignment
{
    public int Id { get; set; }

    /// <summary>Nave a cui appartiene questa assegnazione.</summary>
    public int ShipId { get; set; }

    /// <summary>Nave a cui appartiene questa assegnazione. Ignorata in JSON per evitare il ciclo con Ship.Assignment.</summary>
    [JsonIgnore]
    public Ship Ship { get; set; } = null!;

    /// <summary>Nome della banchina assegnata, ad esempio M-1.</summary>
    public string BerthName { get; set; } = string.Empty;

    /// <summary>Giorno virtuale effettivo di inizio occupazione della banchina.</summary>
    public int StartDay { get; set; }
}
