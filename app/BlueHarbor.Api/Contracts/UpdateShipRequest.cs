using System.ComponentModel.DataAnnotations;

namespace BlueHarbor.Api.Contracts;

/// <summary>Dati inviati dall'Operatore per correggere una nave ancora Pending.</summary>
public class UpdateShipRequest
{
    [Required(ErrorMessage = "Il nome e obbligatorio.")]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Notes { get; set; }
}
