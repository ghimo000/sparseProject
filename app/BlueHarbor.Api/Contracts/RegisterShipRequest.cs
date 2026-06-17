using System.ComponentModel.DataAnnotations;
using BlueHarbor.Faro;

namespace BlueHarbor.Api.Contracts;

/// <summary>
/// Payload per registrare una nave: i dati del faro (mostrati in sola lettura
/// all'Operatore) + i metadati che l'Operatore aggiunge.
///
/// Le annotazioni fanno validare i range automaticamente: con [ApiController]
/// una richiesta fuori range riceve 400 senza arrivare al service.
/// </summary>
public class RegisterShipRequest
{
    [Required(ErrorMessage = "Il nome è obbligatorio.")]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Notes { get; set; }

    [EnumDataType(typeof(ShipSize), ErrorMessage = "Taglia non valida.")]
    public ShipSize Size { get; set; }

    [Range(0, 30, ErrorMessage = "Il giorno di arrivo deve essere entro 30 giorni.")]
    public int ArrivalDayOffset { get; set; }

    [Range(3, 15, ErrorMessage = "La durata deve essere tra 3 e 15 giorni.")]
    public int OccupationDays { get; set; }
}
