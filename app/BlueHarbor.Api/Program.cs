using System.Text.Json.Serialization;
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Services;
using BlueHarbor.Faro;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    // Gli enum viaggiano come stringhe ("XL", "Pending") invece che come numeri.
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Persistenza: EF Core su SQL Server LocalDB.
builder.Services.AddDbContext<BlueHarborDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("BlueHarbor")));

// Il faro: una sola implementazione, registrata dietro l'interfaccia.
// Per cambiarlo (es. sorgente esterna) basterebbe sostituire questa riga.
builder.Services.AddScoped<IShipArrivalSource, RandomShipArrivalSource>();

// Regole di dominio.
builder.Services.AddScoped<ShipRegistrationService>();
builder.Services.AddScoped<VirtualTimeService>();

var app = builder.Build();

// Serve il frontend statico da wwwroot (index.html come pagina di default).
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

app.Run();
