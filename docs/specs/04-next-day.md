# Spec 04 - Next Day

> Stato: **implementata** - Slice: tempo virtuale e storico - Fonte di verita del dominio: [Commessa.md](../Commessa.md)

## Obiettivo

Implementare l'azione **Next Day**, cioe l'avanzamento manuale del giorno virtuale di BlueHarbor.

BlueHarbor non usa il calendario reale: lavora con un contatore di giorni virtuali.
Per rendere la lettura piu chiara agli utenti, mostriamo anche una data fittizia calcolata.

## Regola principale

Il sistema mantiene:

```text
CurrentDay = 0, 1, 2, 3...
```

La data mostrata in UI si calcola partendo da:

```text
Giorno 0 = 01-06-2026
```

Esempi:

| Giorno virtuale | Data mostrata |
|---|---|
| 0 | 01-06-2026 |
| 1 | 02-06-2026 |
| 2 | 03-06-2026 |

La data serve solo per visualizzare meglio lo storico. La verita salvata nel database resta il giorno virtuale.

## Perche non salvare la data nel database

La commessa parla di **giorno corrente virtuale**, non di calendario reale.

Salvare sia `CurrentDay` sia una data produrrebbe due fonti di verita:

```text
CurrentDay = 5
CurrentDate = 10-06-2026
```

In caso di incoerenza non sarebbe chiaro quale dato considerare corretto.

Scelta:

- DB: salva `CurrentDay`;
- backend/frontend: calcolano la data mostrata con base fissa `01-06-2026`;
- storico: usa giorno virtuale + data calcolata.

## Servizio di dominio

Introdurre un nuovo servizio, ad esempio `DayService`.

Responsabilita:

- leggere `AppState.CurrentDay`;
- incrementare il giorno di `1`;
- aggiornare le navi che devono diventare `Departed`;
- salvare le modifiche.

Non deve occuparsi di:

- chiamare il faro;
- generare navi;
- gestire logica frontend;
- assegnare banchine;
- fare pianificazione automatica.

## Nota su `Departed`

La commessa richiede che `Next Day` imposti automaticamente `Departed` alle navi che hanno completato l'occupazione.

Questa regola diventa completa quando saranno implementate le banchine, perche servono almeno:

- banchina assegnata;
- giorno di inizio occupazione;
- durata;
- giorno di fine occupazione.

In questa slice si puo preparare il punto di estensione nel `DayService`, ma senza inventare una partenza se l'assegnazione non esiste ancora.

## Contratto API

Endpoint nuovo:

| Endpoint | Scopo | Output |
|---|---|---|
| `POST /api/state/next-day` | avanza il giorno virtuale di 1 | stato aggiornato |

Output consigliato:

```json
{
  "currentDay": 1,
  "currentDate": "02-06-2026"
}
```

Endpoint esistente da aggiornare:

| Endpoint | Scopo | Output |
|---|---|---|
| `GET /api/state` | legge giorno virtuale e data mostrata | stato corrente |

Output consigliato:

```json
{
  "currentDay": 0,
  "currentDate": "01-06-2026"
}
```

## Frontend

### Pagina Operatore

Header:

```text
BlueHarbor | Giorno/Data corrente | Nuovo arrivo dal faro
```

Responsabilita della pagina:

- registrare nuove navi;
- chiedere al faro una nuova anteprima;
- mostrare lo storico delle navi registrate.

La pagina Operatore **non** contiene il bottone `Next Day`.

### Pagina Scheduler

Header:

```text
BlueHarbor | Giorno/Data corrente | Next Day
```

Responsabilita della pagina:

- vedere le navi `Pending`;
- avanzare il giorno virtuale con `Next Day`;
- vedere lo storico.

La pagina Scheduler deve avere anche una sezione storico, non solo la lista delle navi pending.

## Storico

Le navi non vanno cancellate quando concludono il loro ciclo.

Lo storico deve permettere di vedere:

- nome nave;
- taglia;
- giorno/data di arrivo;
- durata;
- stato (`Pending`, `Assigned`, `Departed`);
- note.

Per ora lo storico puo mostrare i dati gia disponibili. Quando arrivera la slice banchine, potra includere anche banchina assegnata e periodo effettivo di occupazione.

## Cosa non cambia

- Il faro resta separato da BlueHarbor.
- Il faro produce un offset, non una data.
- La registrazione nave continua a calcolare `ArrivalDay = CurrentDay + ArrivalDayOffset`.
- `Next Day` non crea navi.
- `Next Day` non assegna banchine.
- `Next Day` non fa pianificazione automatica.

## File previsti

| Area | File |
|---|---|
| Dominio | `app/BlueHarbor.Api/Domain/AppState.cs` |
| Persistenza | `app/BlueHarbor.Api/Data/BlueHarborDbContext.cs` |
| Service | `app/BlueHarbor.Api/Services/DayService.cs` |
| API | `app/BlueHarbor.Api/Controllers/BlueHarborController.cs` |
| Frontend API | `app/BlueHarbor.Api/wwwroot/api.js` |
| Operatore | `app/BlueHarbor.Api/wwwroot/operator.html`, `app/BlueHarbor.Api/wwwroot/app.js` |
| Scheduler | `app/BlueHarbor.Api/wwwroot/scheduler.html`, `app/BlueHarbor.Api/wwwroot/scheduler.js` |

## Verifica attesa

1. Aprendo Operatore si vede giorno/data corrente e il bottone `Nuovo arrivo dal faro`.
2. Aprendo Scheduler si vede giorno/data corrente e il bottone `Next Day`.
3. Premendo `Next Day`, `CurrentDay` aumenta di 1.
4. La data mostrata avanza coerentemente rispetto a `01-06-2026`.
5. Le navi registrate restano visibili nello storico.
6. Nessuna nave viene assegnata automaticamente.

