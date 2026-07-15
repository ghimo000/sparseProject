# Spec 03 - Review codice ed evidenze

> Stato: **implementata** - Slice: pulizia e robustezza - Fonte: review del codice del 2026-07-03

## Obiettivo

Rendere il codice piu leggibile per studenti non pro, senza aggiungere complessita.

## Scelte fatte

| Area | Evidenza | Scelta |
|---|---|---|
| Controller | `BlueHarborController.cs` | Nome file uguale al nome classe. |
| Commenti | classi API, dominio e Faro | Commenti brevi, chiari, orientati a chi sta imparando. |
| Validazione | `RegisterShip` | Il nome nave non puo essere vuoto o solo spazi. |
| Basic Auth | `Program.cs` | Header Basic malformati restituiscono `401`, non errore server. |
| Risposta POST nave | `RegisterShip` | Ritorna `Ok(ship)`, semplice e coerente con gli endpoint attuali. |
| Terminologia | spec e commenti | Rimosso il termine tecnico `seam`, sostituito con "interfaccia". |

## Cosa non cambia

- Gli endpoint restano invariati: `/api/state`, `/api/arrivals`, `/api/ships`.
- Il frontend resta vanilla HTML/CSS/JS.
- Il controller resta unico per mantenere la lettura semplice.
- La Basic Auth resta solo una demo, non un sistema di login reale.

## Verifica

Build verificata con output temporaneo:

```powershell
dotnet build app/BlueHarbor.Api/BlueHarbor.Api.csproj -o .tmp/build-check
```

Risultato: `0 errori`, `0 warning`.


