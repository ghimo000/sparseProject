# Spec 05 - Banchine

> Stato: **implementata** - Slice: assegnazione banchine - Fonte di verita del dominio: [Commessa.md](../Commessa.md)

## Obiettivo

Implementare la gestione delle banchine di BlueHarbor in modo semplice e coerente con
la commessa.

Lo Scheduler assegna le navi `Pending` a una banchina compatibile per taglia.
La disponibilita non si valuta come "la banchina ha gia una nave assegnata", ma come
assenza di sovrapposizione tra finestre temporali.

## Banchine disponibili

L'insieme delle banchine e fisso:

| Nome | Taglia |
|---|---|
| `XL-1` | XL |
| `L-1` | L |
| `M-1` | M |
| `M-2` | M |
| `S-1` | S |
| `S-2` | S |
| `S-3` | S |
| `S-4` | S |

Una banchina puo ospitare solo navi della propria taglia.

## Significato di `ArrivalDay`

Non introduciamo un nuovo campo per distinguere "giorno richiesto" e "giorno assegnato".

Scelta:

```text
ArrivalDay = giorno pianificato di ingresso in porto / inizio occupazione banchina
```

Quando la nave e `Pending`, `ArrivalDay` e il giorno proposto dal faro.
Quando lo Scheduler assegna la nave e deve spostarla al primo slot libero,
`ArrivalDay` viene aggiornato al giorno effettivo pianificato.

Questa scelta evita un campo in piu e rinuncia consapevolmente allo storico del
giorno originario proposto dal faro. Per questa commessa va bene: non servono KPI,
ritardi o audit.

## Stato nave e stato banchina

Gli stati dominio della nave restano quelli gia previsti:

```text
Pending -> Assigned -> Departed
```

Non aggiungiamo stati come `Scheduled`.

Una nave puo essere `Assigned` anche se arriva in futuro.

Lo stato della banchina e invece calcolato rispetto al giorno corrente.

### Banchina occupata ora

Una banchina e occupata oggi se esiste una nave `Assigned` su quella banchina con:

```text
ArrivalDay <= CurrentDay < ArrivalDay + OccupationDays
```

### Banchina libera ora, prenotata in futuro

Una banchina e libera oggi ma prenotata in futuro se la prossima nave assegnata ha:

```text
CurrentDay < ArrivalDay
```

### Banchina libera

Una banchina e libera se oggi non e occupata.
Puo comunque avere assegnazioni future, che vanno mostrate come prenotazioni.

## Regola di sovrapposizione

Ogni occupazione e trattata come intervallo:

```text
[ArrivalDay, ArrivalDay + OccupationDays)
```

Due finestre collidono se:

```text
startA < endB && startB < endA
```

Quindi:

```text
[5, 10) e [10, 15) non collidono
```

Una nave puo essere assegnata a una banchina gia prenotata in futuro se la sua
finestra non interferisce.

Esempio:

```text
oggi = 0
nave A: ArrivalDay = 20, OccupationDays = 10 -> [20, 30)
nave B: ArrivalDay = 5, OccupationDays = 5  -> [5, 10)
```

Se A e gia assegnata a `M-1`, B puo essere assegnata a `M-1` perche le finestre
non si sovrappongono.

## Assegnazione Scheduler

Quando lo Scheduler assegna una nave:

1. considera solo banchine della stessa taglia della nave;
2. prova la finestra richiesta `[ArrivalDay, ArrivalDay + OccupationDays)`;
3. se una banchina compatibile e libera in quella finestra, assegna la nave;
4. se piu banchine sono valide, sceglie la prima in ordine nome;
5. se nessuna banchina e libera nella finestra richiesta, cerca giorno per giorno
   il primo slot disponibile;
6. salva la banchina assegnata;
7. aggiorna `ArrivalDay` al giorno effettivo pianificato, se diverso;
8. imposta `Status = Assigned`.

Ordine banchine:

```text
XL-1
L-1
M-1, M-2
S-1, S-2, S-3, S-4
```

## Messaggio se la finestra richiesta e occupata

Se la nave non puo essere assegnata nel giorno proposto dal faro ma viene spostata
al primo slot libero, la UI mostra un messaggio informativo:

```text
Banchina occupata nella finestra richiesta: nave assegnata al primo slot libero.
```

Non e un errore bloccante, perche la commessa richiede di pianificare nel primo slot
temporale disponibile.

## Next Day e partenza

L'azione `Next Day` non assegna banchine.

Quando il giorno virtuale avanza, le navi assegnate diventano `Departed` se hanno
completato la finestra di occupazione:

```text
CurrentDay >= ArrivalDay + OccupationDays
```

Una nave `Departed` non occupa piu la banchina.

## Cancellazione navi

Lo Scheduler puo cancellare una nave.

Se la nave era assegnata, la cancellazione libera implicitamente la banchina per
quella finestra.

Non implementiamo modifica o riassegnazione dopo l'assegnazione: la cancellazione e
l'unica azione correttiva prevista.

## Operatore

L'Operatore:

- registra nuove navi;
- visualizza lo stato delle banchine;
- non assegna banchine;
- non modifica banchine o assegnazioni;
- non cancella navi.

## Vista Scheduler

La pagina Scheduler deve mostrare:

- navi `Pending` assegnabili;
- stato attuale delle banchine;
- prenotazioni future;
- azione per assegnare una nave;
- azione per cancellare una nave.

Per ogni banchina, visualizzazione minima:

```text
M-1
Stato oggi: libera / occupata
Nave corrente: nome nave, se presente
Prossima prenotazione: nome nave + periodo, se presente
```

## Vista Operatore

La pagina Operatore deve mostrare lo stato delle banchine in sola lettura.

Non deve mostrare comandi di assegnazione, cancellazione o modifica.

## Persistenza minima prevista

Serve salvare sulla nave almeno:

| Campo | Scopo |
|---|---|
| `BerthName` | banchina assegnata, es. `M-1` |
| `ArrivalDay` | giorno pianificato di inizio occupazione |
| `OccupationDays` | durata occupazione |
| `Status` | `Pending`, `Assigned`, `Departed` |

Non serve salvare una tabella banchine: l'elenco e fisso e puo vivere nel codice.

## Cosa non facciamo

- niente ottimizzazione;
- niente KPI;
- niente riassegnazione;
- niente nuovo stato `Scheduled`;
- niente campo per il giorno originario proposto dal faro;
- niente tabella banchine, salvo necessita futura.

## File previsti

| Area | File |
|---|---|
| Dominio | `app/BlueHarbor.Api/Domain/Ship.cs` |
| Dominio | nuovo file possibile `app/BlueHarbor.Api/Domain/Berth.cs` o costanti equivalenti |
| Persistenza | `app/BlueHarbor.Api/Data/BlueHarborDbContext.cs` |
| Service | nuovo file possibile `app/BlueHarbor.Api/Services/BerthSchedulerService.cs` |
| API | `app/BlueHarbor.Api/Controllers/BlueHarborController.cs` |
| Frontend API | `app/BlueHarbor.Api/wwwroot/api.js` |
| Operatore | `app/BlueHarbor.Api/wwwroot/operator.html`, `app/BlueHarbor.Api/wwwroot/app.js` |
| Scheduler | `app/BlueHarbor.Api/wwwroot/scheduler.html`, `app/BlueHarbor.Api/wwwroot/scheduler.js` |

## Verifica attesa

1. A giorno 0 tutte le banchine risultano libere.
2. Una nave `Pending` XL viene assegnata solo a `XL-1`.
3. Una nave `Pending` M viene assegnata a `M-1` se disponibile, altrimenti a `M-2`.
4. Due navi della stessa taglia con finestre non sovrapposte possono usare la stessa banchina.
5. Se la finestra richiesta e occupata, la nave viene spostata al primo slot libero.
6. Se la nave viene spostata, `ArrivalDay` diventa il giorno effettivo pianificato.
7. Una nave `Assigned` futura non rende la banchina occupata oggi.
8. Una nave `Assigned` in corso rende la banchina occupata oggi.
9. `Next Day` imposta `Departed` alle navi con occupazione conclusa.
10. Lo Scheduler puo cancellare una nave.
11. L'Operatore vede le banchine ma non puo modificarle.
