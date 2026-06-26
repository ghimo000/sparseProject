# Spec 02 — Next Day

> Stato: **implementata; verifica end-to-end pianificata** · Slice: modello temporale · Fonte di verità del dominio: [Commessa.md](../Commessa.md)

## Contesto

BlueHarbor non è un sistema real-time. La commessa richiede un **giorno corrente
virtuale** e un'azione manuale **Next Day** che avanza il tempo di un giorno alla
volta, senza ore e minuti.

Questa slice rende visibile e modificabile il giorno virtuale dal frontend, ma non
introduce ancora banchine, assegnazioni o pianificazione.

---

## Spec #1 — Giorno virtuale

Il dominio continua a salvare il tempo come numero intero:

```text
CurrentDay = 0, 1, 2, ...
```

Motivo: per arrivi, durate e future occupazioni delle banchine è più semplice e
meno ambiguo ragionare in giorni interi.

Per l'utente, l'API espone anche una data virtuale leggibile:

```text
BaseDate + CurrentDay
```

Assunzione didattica:

```text
BaseDate = 2026-06-26
```

Esempi:

| CurrentDay | Data mostrata |
|---:|---|
| 0 | 2026-06-26 |
| 1 | 2026-06-27 |
| 2 | 2026-06-28 |

---

## Spec #2 — Azione "Next Day"

Flusso:

1. L'utente clicca il bottone **Next Day**.
2. Il frontend chiama l'API.
3. Il backend incrementa `CurrentDay` di 1.
4. L'API ritorna il nuovo stato temporale.
5. Il frontend aggiorna la data corrente e ricarica l'elenco navi.

Regole:

- avanza sempre di **un solo giorno**;
- non gestisce ore o minuti;
- non usa timer o eventi real-time;
- non effettua assegnazioni automatiche;
- per questa slice non cambia lo stato delle navi, perché le assegnazioni non sono
  ancora modellate.

---

## Contratto API

| Endpoint | Scopo | Output |
|---|---|---|
| `GET /api/state` | legge il giorno virtuale corrente | `{ currentDay, currentDate }` |
| `POST /api/state/next-day` | avanza il giorno virtuale di 1 | `{ currentDay, currentDate }` |

`currentDate` viaggia come data ISO (`YYYY-MM-DD`), senza ore e minuti.

---

## Fuori scope

- Nessuna pianificazione automatica.
- Nessun avanzamento real-time.
- Nessuna logica banchine.
- Nessun passaggio a `Departed` finché non esiste il modello di assegnazione.

## Verifica

Verificato in questa sessione:

- build backend completata senza errori;
- sintassi JavaScript valida;
- wiring frontend/API predisposto tramite `api.js`.

Da verificare nella prossima sessione:

- test end-to-end con API ASP.NET in esecuzione;
- persistenza disponibile e migration applicata;
- click su **Nuovo arrivo dal faro**, creazione nave e **Next Day** dalla UI.
