# Spec 01 — Faro e Registrazione Nave

> Stato: **implementata e verificata** (Sessione 01, 2026-06-17) · Slice: ingresso navi · Fonte di verità del dominio: [Commessa.md](../Commessa.md)

## Contesto

In BlueHarbor le navi non sono "accettate" automaticamente. Modelliamo una sorgente
di arrivi — il **Faro** — che trasmette solo i *dati grezzi* di una nave in arrivo.
È l'**Operatore** che li riceve, aggiunge i metadati (nome, note) e registra la nave
nel sistema. Questo rispetta la commessa: registrare le navi è una responsabilità di
ruolo dell'Operatore ([Commessa.md](../Commessa.md), sez. Ruoli).

Il Faro è **logicamente e fisicamente separato** dal dominio (progetto `BlueHarbor.Faro`),
così non può dipendere dal dominio: lo impedisce il compilatore.

---

## Spec #1 — Il Faro (contratto)

**Responsabilità:** produrre i dati grezzi di un singolo arrivo.

**Cosa NON fa:**
- nome/note → li aggiunge l'Operatore;
- id e persistenza → BlueHarbor / DB;
- stato → lo imposta BlueHarbor (`Pending`);
- banchina/assegnazione → decisione dello Scheduler, in una slice successiva.

**Output — `ShipArrival` (oggetto C#, non JSON):**

| Campo | Tipo | Regola |
|---|---|---|
| `Size` | enum {S, M, L, XL} | casuale |
| `ArrivalDayOffset` | int **0..30** | giorni rispetto al giorno corrente di BlueHarbor |
| `OccupationDays` | int **3..15** | casuale |

**Seam:** `IShipArrivalSource.Next() : ShipArrival`
**Implementazione attuale:** `RandomShipArrivalSource` (casuale).

### Perché un oggetto e non JSON

Il JSON è un formato di *trasporto*: serve solo quando si attraversa un confine di
processo/rete. Il faro è interno → nessun confine → ritorna un oggetto tipizzato.
Il JSON nasce **solo** al confine HTTP (API → browser), serializzato in automatico
da ASP.NET. Se un giorno il faro diventasse esterno, basterebbe una nuova
implementazione di `IShipArrivalSource` (es. `HttpShipArrivalSource`) che deserializza
il JSON internamente: il dominio non cambierebbe.

---

## Spec #2 — Caso d'uso "Registrazione nave" (Operatore) — variante A (anteprima)

1. L'Operatore avvia "nuovo arrivo" → BlueHarbor chiama `IShipArrivalSource.Next()`.
2. La UI mostra i dati del faro in **sola lettura** + campi per nome e note.
3. L'Operatore compila nome/note e conferma.
4. BlueHarbor crea la nave: dati del faro + metadati + `Status = Pending` +
   `ArrivalDay = giornoCorrente + ArrivalDayOffset`. Salva.

### Contratto API (implementato)

| Endpoint | Scopo | Output |
|---|---|---|
| `POST /api/arrivals` | il faro genera e ritorna un arrivo (anteprima) | `ShipArrival` in JSON |
| `POST /api/ships` | crea la nave `Pending` con dati faro + nome/note | nave creata |
| `GET /api/ships` | elenco navi registrate | lista in JSON |
| `GET /api/state` | giorno virtuale corrente | `{ currentDay }` |

Il server **valida i range** ricevuti (`Size` valida, `offset ∈ 0..30`, `durata ∈ 3..15`):
non si fida ciecamente del client. Verificato: dati fuori range → **HTTP 400**.

---

## Assunzioni (giustificate)

- **`ArrivalDayOffset` 0..30 inclusi.** La commessa dice "non oltre 30 giorni dal giorno
  corrente"; interpretiamo come offset da 0 (arriva oggi) a 30 (arriva fra 30 giorni).

## Fuori scope (da [Commessa.md](../Commessa.md), sez. Fuori dallo scope)

- nessuna pianificazione/ottimizzazione automatica;
- nessun KPI, nessun real-time;
- il faro **non** fa avanzare il tempo: l'orologio avanza solo con *Next Day*.

## Registro decisioni

- Faro interno dietro interfaccia, esternalizzabile in futuro senza toccare il dominio.
- Trigger = Operatore (manuale). Flusso = variante A (anteprima → metadati → crea).
- Il faro emette un **offset**, non una data: l'orologio appartiene a BlueHarbor.
