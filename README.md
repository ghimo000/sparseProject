# BlueHarbor

BlueHarbor è un'applicazione didattica per la gestione degli arrivi delle navi e delle assegnazioni alle banchine. Il backend è sviluppato con ASP.NET Core, mentre il frontend usa HTML, CSS e JavaScript vanilla.

## Requisiti

- Windows
- [.NET SDK 10](https://dotnet.microsoft.com/download/dotnet/10.0)
- SQL Server 2022 o successivo, con autenticazione Windows abilitata

Per controllare che .NET e il servizio SQL Server siano disponibili:

```powershell
dotnet --version
Get-Service MSSQLSERVER
```

## Avvio dell'app

Dalla cartella principale del repository, ripristinare le dipendenze:

```powershell
dotnet restore app/BlueHarbor.Api/BlueHarbor.Api.csproj
```

Avviare quindi l'applicazione:

```powershell
dotnet run --project app/BlueHarbor.Api/BlueHarbor.Api.csproj -- --urls http://localhost:5000
```

Al primo avvio l'app crea il database `BlueHarbor` sull'istanza SQL Server configurata e applica automaticamente le migration disponibili.

Aprire nel browser [http://localhost:5000](http://localhost:5000).

## Credenziali demo

| Ruolo | Username | Password |
|---|---|---|
| Operatore | `operator` | `operator` |
| Scheduler | `admin` | `admin` |

Per arrestare l'applicazione, tornare nel terminale e premere `Ctrl+C`.

## Verifica della compilazione

Per compilare il progetto senza avviarlo:

```powershell
dotnet build app/BlueHarbor.Api/BlueHarbor.Api.csproj
```

## Configurazione SQL Server

La configurazione predefinita usa l'istanza SQL Server locale predefinita con autenticazione Windows:

```text
Server=.;Database=BlueHarbor;Trusted_Connection=True;TrustServerCertificate=True
```

La stringa si trova in `app/BlueHarbor.Api/appsettings.json` e puo essere sovrascritta senza modificare il file impostando la variabile d'ambiente `ConnectionStrings__BlueHarbor`.

Se l'app non riesce a collegarsi, verificare che `MSSQLSERVER` sia in esecuzione e che l'utente Windows che avvia l'app abbia accesso all'istanza e al database.
