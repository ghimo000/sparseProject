# Diario - Sessione 02 (2026-07-03)

Sintesi di cosa abbiamo cambiato a fine sessione e perche.

## Obiettivo

Rendere il progetto piu leggibile per studenti alle prime armi:

- separare il frontend per ruolo;
- aggiungere una autenticazione demo molto semplice;
- semplificare i controller in un unico file;
- documentare le scelte fatte.

## Cosa abbiamo fatto

| Area | File | Scelta |
|---|---|---|
| Frontend | `wwwroot/index.html` | Diventa la pagina pubblica di scelta ruolo. |
| Frontend | `wwwroot/operator.html` | Contiene la schermata Operatore per registrare navi. |
| Frontend | `wwwroot/scheduler.html` | Contiene una prima schermata Scheduler con navi `Pending`. |
| Frontend | `wwwroot/api.js` | Resta il punto unico dove sono scritti gli URL delle API. |
| Frontend | `wwwroot/app.js` | Gestisce solo la pagina Operatore. |
| Frontend | `wwwroot/scheduler.js` | Gestisce solo la pagina Scheduler. |
| Backend | `Program.cs` | Aggiunge Basic Auth demo per le due pagine di ruolo. |
| Backend | `Controllers/Controller.cs` | Accorpa gli endpoint in un solo controller leggibile. |

## Credenziali demo

| Pagina | Utente | Password |
|---|---|---|
| `/operator.html` | `operator` | `operator` |
| `/scheduler.html` | `admin` | `admin` |

Questa non e autenticazione da produzione. Serve solo a mostrare la separazione tra
Operatore e Scheduler senza introdurre ASP.NET Identity, utenti su database o token.

## Controller unico

Prima gli endpoint erano divisi in tre file:

- `ArrivalsController.cs`;
- `ShipsController.cs`;
- `StateController.cs`.

Ora sono in:

- `Controllers/Controller.cs`.

Gli URL non sono cambiati:

```text
GET  /api/state
POST /api/arrivals
GET  /api/ships
POST /api/ships
```

Motivo della scelta: per questa fase didattica e piu facile leggere un unico file e
seguire il flusso completo. La regola importante resta valida: il controller riceve
HTTP e risponde, mentre la logica di dominio resta nei service.

## Comandi utili

Dalla root del repo:

```powershell
dotnet build app\BlueHarbor.Api\BlueHarbor.Api.csproj
dotnet run --project app\BlueHarbor.Api
```

Dalla cartella `app/BlueHarbor.Api`:

```powershell
dotnet build
dotnet run
```

## Verificato

La build e stata verificata con:

```powershell
dotnet build app\BlueHarbor.Api\BlueHarbor.Api.csproj --no-restore
```

Risultato: compilazione completata, 0 errori, 0 warning.

## Prossimi passi

1. Implementare `Next Day`.
2. Modellare banchine e assegnazioni Scheduler.
3. Valutare se proteggere anche gli endpoint API, non solo le pagine HTML.

