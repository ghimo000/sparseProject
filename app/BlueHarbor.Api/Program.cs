using System.Text.Json.Serialization;
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Services;
using BlueHarbor.Faro;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Override locale (solo su questa macchina, non versionato): punta a LocalDB.
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    // Gli enum escono come testo, ad esempio "XL" o "Pending".
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Salva i dati con EF Core: SQL Server di default, SQLite solo se la config locale lo richiede (vedi appsettings.Local.json).
var connectionString = builder.Configuration.GetConnectionString("BlueHarbor");
var useSqlite = builder.Configuration["Database:Provider"] == "Sqlite";
builder.Services.AddDbContext<BlueHarborDbContext>(options =>
{
    if (useSqlite)
    {
        options.UseSqlite(connectionString);
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

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

// Crea il database prima di avviare l'app: migration su SQL Server, schema diretto dal modello su SQLite locale
// (le migration sono scritte per SQL Server e non vanno rigiocate contro un provider diverso).
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<BlueHarborDbContext>();
    if (useSqlite)
    {
        dbContext.Database.EnsureCreated();
    }
    else
    {
        dbContext.Database.Migrate();
    }
}

const string AuthCookieName = "BlueHarborAuth";
var authProtector = app.Services
    .GetRequiredService<IDataProtectionProvider>()
    .CreateProtector("BlueHarbor.RoleCookie");

app.MapPost("/login", async (HttpContext context) =>
{
    var form = await context.Request.ReadFormAsync();
    var returnUrl = NormalizeReturnUrl(form["returnUrl"].ToString());

    var username = form["username"].ToString();
    var password = form["password"].ToString();

    // Un solo tasto di accesso: il ruolo si deduce dalle credenziali, non da quale bottone e stato premuto.
    var role = ResolveRole(username, password);

    if (role is null)
    {
        context.Response.Redirect($"/?returnUrl={Uri.EscapeDataString(returnUrl)}&error=1");
        return;
    }

    context.Response.Cookies.Append(
        AuthCookieName,
        authProtector.Protect(role),
        new CookieOptions
        {
            HttpOnly = true,
            IsEssential = true,
            SameSite = SameSiteMode.Lax
        });

    // Se l'utente era arrivato al login per una pagina protetta del proprio ruolo, ci torna;
    // altrimenti finisce sulla pagina di default del ruolo con cui si e autenticato.
    var requestedPage = GetProtectedPage(returnUrl);
    var landingUrl = requestedPage is not null && requestedPage.Value.Role == role
        ? returnUrl
        : DefaultPageForRole(role);

    context.Response.Redirect(landingUrl);
});

// Cancella il cookie di sessione e torna al login.
app.MapPost("/logout", (HttpContext context) =>
{
    context.Response.Cookies.Delete(AuthCookieName);
    context.Response.Redirect("/");
});

// Login demo: protegge le due pagine di ruolo, piu il calendario che accetta un ruolo qualsiasi.
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/calendar.html")
    {
        if (IsAnyRoleAuthorized(context, authProtector, AuthCookieName))
        {
            await next();
            return;
        }

        context.Response.Redirect($"/?returnUrl={Uri.EscapeDataString(context.Request.Path)}");
        return;
    }

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

    context.Response.Redirect($"/?returnUrl={Uri.EscapeDataString(context.Request.Path)}");
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

// Deduce il ruolo dalle credenziali inserite nell'unico form di login: prova le credenziali
// di ciascun ruolo protetto, senza dipendere da quale pagina l'utente stesse per raggiungere.
static string? ResolveRole(string username, string password)
{
    var operatorPage = GetProtectedPage("/operator.html")!.Value;
    if (username == operatorPage.User && password == operatorPage.Password)
    {
        return operatorPage.Role;
    }

    var schedulerPage = GetProtectedPage("/scheduler.html")!.Value;
    if (username == schedulerPage.User && password == schedulerPage.Password)
    {
        return schedulerPage.Role;
    }

    return null;
}

// Pagina di atterraggio predefinita per un ruolo appena autenticato.
static string DefaultPageForRole(string role) => role == "operator" ? "/operator.html" : "/scheduler.html";

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

// Controlla il cookie di sessione senza vincolarlo a un ruolo specifico (usato dal calendario condiviso).
static bool IsAnyRoleAuthorized(HttpContext context, IDataProtector authProtector, string authCookieName)
{
    if (!context.Request.Cookies.TryGetValue(authCookieName, out var protectedRole))
    {
        return false;
    }

    try
    {
        var role = authProtector.Unprotect(protectedRole);
        return role is "operator" or "scheduler";
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
