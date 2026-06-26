# Diario — Sessione 01 (2026-06-17)

Sintesi di cosa abbiamo costruito e **perché**. Per i dettagli del contratto vedi
[specs/01-faro-registrazione-nave.md](../specs/01-faro-registrazione-nave.md).

## Obiettivo della sessione

Partire dal repo vuoto e arrivare a uno **scheletro che cammina** (walking skeleton):
una fetta verticale che attraversa tutti i livelli per una sola funzionalità —
**registrare una nave** — così da validare subito l'architettura.

## Cosa abbiamo creato

| Componente | Dove | Perché |
|---|---|---|
| **Faro** (`IShipArrivalSource` + `RandomShipArrivalSource`) | `app/BlueHarbor.Faro/` | Sorgente degli arrivi, separata dal dominio. Genera taglia/arrivo/durata casuali. È dietro un'interfaccia: domani potrebbe diventare esterna senza toccare il dominio. |
| **Dominio** (`Ship`, `ShipStatus`, `AppState`) | `app/BlueHarbor.Api/Domain/` | Le entità del problema. `AppState` tiene il giorno virtuale corrente. |
| **Persistenza** (`BlueHarborDbContext` + migration) | `app/BlueHarbor.Api/Data/` | EF Core code-first su SQL Server LocalDB. Il DB nasce dal modello, versionato in git. |
| **Service** (`ShipRegistrationService`) | `app/BlueHarbor.Api/Services/` | Le regole di dominio (calcolo `arrivalDay`, stato `Pending`) stanno QUI, non nei controller né nel frontend. |
| **API** (`arrivals`, `ships`, `state`) | `app/BlueHarbor.Api/Controllers/` | Controller sottili: traducono HTTP↔oggetti, delegano al service. |
| **Frontend minimo** (`index.html`, `api.js`, `app.js`) | `app/BlueHarbor.Api/wwwroot/` | Per *vedere* il giro. `api.js` centralizza tutti gli endpoint: il resto del JS non hardcoda URL. |

## Decisioni chiave (e il perché)

- **Faro come sorgente esterna "logica", interna come codice.** Separa "produrre arrivi"
  da "gestire navi". Il trigger resta l'**Operatore** (come da commessa); il faro non
  fa avanzare il tempo (niente real-time).
- **Il faro ritorna oggetti, non JSON.** Il JSON è formato di trasporto: nasce solo al
  confine HTTP (API→browser), in automatico. Internamente si lavora con tipi C#.
- **Flusso "variante A" (anteprima → metadati → crea).** Il faro genera, l'Operatore
  vede i dati in sola lettura e aggiunge nome/note, poi conferma. Il server **valida i range**.
- **`arrivalDay` assoluto.** L'offset del faro (0..30) viene congelato a
  `giornoCorrente + offset` al momento della registrazione.
- **`ShipSize` resta nel Faro.** L'API lo referenzia comunque per chiamare il faro:
  niente progetto condiviso in più. Semplicità > purezza (come chiede la commessa).
- **Enum salvati come stringa** nel DB: più leggibili da ispezionare.

## Verificato end-to-end

`GET /api/state` → giorno 0 · `POST /api/arrivals` → faro genera · `POST /api/ships`
→ nave `Pending` con `arrivalDay` calcolato dal server · dati fuori range → **HTTP 400**
· `GET /api/ships` → la nave è nel DB.

## Come far girare il progetto

```bash
dotnet tool install --global dotnet-ef            # una volta sola
dotnet ef database update -p app/BlueHarbor.Api -s app/BlueHarbor.Api
dotnet run --project app/BlueHarbor.Api
```

## Prossimi passi (slice candidate)

1. **Login + ruoli** (Operatore/Scheduler) — ordina tutto il resto.
2. **Next Day** — incrementa il giorno virtuale e porta a `Departed` chi ha finito.
3. **Scheduler: assegnazione banchine** — il cuore (regola "primo slot libero").
