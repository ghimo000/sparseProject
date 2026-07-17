using System.Text.Json.Serialization;
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Services;
using BlueHarbor.Faro;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    // Gli enum escono come testo, ad esempio "XL" o "Pending".
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Salva i dati con EF Core sull'istanza SQL Server configurata.
builder.Services.AddDbContext<BlueHarborDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("BlueHarbor")));

// Sorgente degli arrivi nave: oggi e un generatore casuale.
builder.Services.AddScoped<IShipArrivalSource, RandomShipArrivalSource>();

// Service con le regole per registrare una nave.
builder.Services.AddScoped<ShipRegistrationService>();

// Service con le regole per avanzare il giorno virtuale.
builder.Services.AddScoped<DayService>();

// Service con le regole per assegnare le navi alle banchine.
builder.Services.AddScoped<BerthSchedulerService>();

builder.Services.AddDataProtection();

var app = builder.Build();

// Crea il database e applica le migration mancanti prima di avviare l'app.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<BlueHarborDbContext>();
    dbContext.Database.Migrate();
}

const string AuthCookieName = "BlueHarborAuth";
var authProtector = app.Services
    .GetRequiredService<IDataProtectionProvider>()
    .CreateProtector("BlueHarbor.RoleCookie");

app.MapPost("/login", async (HttpContext context) =>
{
    var form = await context.Request.ReadFormAsync();
    var returnUrl = NormalizeReturnUrl(form["returnUrl"].ToString());
    var protectedPage = GetProtectedPage(returnUrl);

    if (protectedPage is null)
    {
        context.Response.Redirect("/");
        return;
    }

    var username = form["username"].ToString();
    var password = form["password"].ToString();

    if (IsAuthorized(username, password, protectedPage.Value.User, protectedPage.Value.Password))
    {
        context.Response.Cookies.Append(
            AuthCookieName,
            authProtector.Protect(protectedPage.Value.Role),
            new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                SameSite = SameSiteMode.Lax
            });

        context.Response.Redirect(returnUrl);
        return;
    }

    context.Response.Redirect($"/login.html?returnUrl={Uri.EscapeDataString(returnUrl)}&error=1");
});

// Login demo: protegge solo le due pagine di ruolo.
app.Use(async (context, next) =>
{
    var protectedPage = GetProtectedPage(context.Request.Path);

    if (protectedPage is null)
    {
        await next();
        return;
    }

    if (IsRoleAuthorized(context, authProtector, AuthCookieName, protectedPage.Value.Role))
    {
        await next();
        return;
    }

    context.Response.Redirect($"/login.html?returnUrl={Uri.EscapeDataString(context.Request.Path)}");
});

// Pubblica i file HTML, CSS e JS dentro wwwroot.
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

app.Run();

// Dice quali credenziali servono per una pagina protetta.
static (string User, string Password, string Role)? GetProtectedPage(PathString path)
{
    if (path == "/operator.html")
    {
        return ("operator", "operator", "operator");
    }

    if (path == "/scheduler.html")
    {
        return ("admin", "admin", "scheduler");
    }

    return null;
}

// Controlla utente e password inseriti nella pagina di login.
static bool IsAuthorized(string username, string password, string expectedUser, string expectedPassword)
{
    return username == expectedUser && password == expectedPassword;
}

// Controlla il cookie creato dal server dopo il login.
static bool IsRoleAuthorized(
    HttpContext context,
    IDataProtector authProtector,
    string authCookieName,
    string expectedRole)
{
    if (!context.Request.Cookies.TryGetValue(authCookieName, out var protectedRole))
    {
        return false;
    }

    try
    {
        return authProtector.Unprotect(protectedRole) == expectedRole;
    }
    catch
    {
        return false;
    }
}

// Accetta solo URL interni, cosi il login non puo redirigere fuori dall'app.
static string NormalizeReturnUrl(string? returnUrl)
{
    if (string.IsNullOrWhiteSpace(returnUrl))
    {
        return "/";
    }

    if (returnUrl.StartsWith("//") || returnUrl.Contains("://", StringComparison.Ordinal))
    {
        return "/";
    }

    if (!returnUrl.StartsWith('/'))
    {
        returnUrl = "/" + returnUrl;
    }

    var queryStart = returnUrl.IndexOf('?');
    return queryStart >= 0 ? returnUrl[..queryStart] : returnUrl;
}
