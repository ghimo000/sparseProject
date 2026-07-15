# Spec 02 - Pagine ruolo e autenticazione base

> Stato: **implementata** - Slice: separazione Operatore/Scheduler - Fonte di verita del dominio: [Commessa.md](../Commessa.md)

## Contesto

La commessa richiede due ruoli applicativi:

- **Operatore**, che registra le navi;
- **Scheduler**, che gestisce le assegnazioni alle banchine.

Il focus del progetto resta l'architettura e la logica di dominio, non un sistema di
identity completo. Per mantenere la soluzione semplice, separiamo le schermate per ruolo
e proteggiamo ciascuna con autenticazione HTTP Basic minimale.

## Scelta

L'applicazione espone:

| Pagina | Ruolo | Credenziali demo |
|---|---|---|
| `/operator.html` | Operatore | `operator` / `operator` |
| `/scheduler.html` | Scheduler/Admin | `admin` / `admin` |

La homepage `/index.html` resta pubblica e contiene solo la scelta del ruolo.

## Cosa fa

- Protegge le due pagine di ruolo con Basic Auth.
- Mantiene separate le schermate frontend.
- Evita di introdurre ASP.NET Identity, utenti su database, sessioni o token.
- Lascia pubblica la homepage di scelta ruolo.
- Mantiene invariati gli endpoint API gia usati dal frontend.

## Cosa NON fa

- Non e un sistema di autenticazione reale per produzione.
- Non modella utenti persistiti nel database.
- Non introduce gestione password, reset password, registrazione utenti o permessi dinamici.

## Assunzione

Le credenziali sono hardcoded perche l'obiettivo e dimostrare la separazione dei ruoli
senza spostare il focus dalla logica di BlueHarbor.

## File coinvolti

| File | Responsabilita |
|---|---|
| `app/BlueHarbor.Api/Program.cs` | Contiene la Basic Auth demo per le pagine protette. |
| `app/BlueHarbor.Api/wwwroot/index.html` | Homepage pubblica con scelta ruolo. |
| `app/BlueHarbor.Api/wwwroot/operator.html` | Pagina Operatore per registrare navi. |
| `app/BlueHarbor.Api/wwwroot/scheduler.html` | Pagina Scheduler per consultare le navi pending. |
| `app/BlueHarbor.Api/wwwroot/api.js` | Punto unico per le chiamate `fetch()` verso il backend. |
| `app/BlueHarbor.Api/wwwroot/app.js` | Logica della pagina Operatore. |
| `app/BlueHarbor.Api/wwwroot/scheduler.js` | Logica della pagina Scheduler. |

## Verifica manuale

- Aprire `/operator.html` richiede `operator` / `operator`.
- Aprire `/scheduler.html` richiede `admin` / `admin`.
- Aprire `/index.html` non richiede credenziali.

