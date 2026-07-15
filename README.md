# BlueHarbor

BlueHarbor è un'applicazione didattica per la gestione degli arrivi delle navi e delle assegnazioni alle banchine. Il backend è sviluppato con ASP.NET Core, mentre il frontend usa HTML, CSS e JavaScript vanilla.

## Requisiti

- Windows
- [.NET SDK 10](https://dotnet.microsoft.com/download/dotnet/10.0)
- SQL Server Express LocalDB, con l'istanza predefinita `MSSQLLocalDB`

Per controllare che .NET e LocalDB siano disponibili:

```powershell
dotnet --version
sqllocaldb info
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

Al primo avvio l'app crea il database locale e applica automaticamente le migration disponibili.

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

## Problemi con LocalDB

Se l'app non riesce a collegarsi al database, verificare che l'istanza predefinita esista e avviarla:

```powershell
sqllocaldb info MSSQLLocalDB
sqllocaldb start MSSQLLocalDB
```

La stringa di connessione si trova in `app/BlueHarbor.Api/appsettings.json`.
