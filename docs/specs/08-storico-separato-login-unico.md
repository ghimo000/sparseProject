# Spec 08 - Storico separato per ruolo, login a un tasto, rifiniture calendario

> Stato: **implementata** - Slice: usabilita e correzioni UX - Fonte di verita del dominio: [Commessa.md](../Commessa.md)

## Obiettivo

Correggere un problema di usabilita segnalato durante i test manuali (cancellare una
nave dallo storico di una pagina la faceva sparire ovunque, calendario incluso) e
rifinire alcuni dettagli UX rimasti dalla [spec 07](07-ux-dashboard-storico.md): login
a due bottoni, pallini poco informativi nel calendario, icone decentrate nei bottoni
circolari, flash nel cambio tema.

Nessuna modifica alle regole di dominio della commessa.

## Storico separato per ruolo (URGENTE)

> Prima di questa spec, `DELETE /api/ships/{id}` cancellava la nave dal database: la
> cancellazione era quindi visibile ovunque, calendario compreso. Segnalato come bug
> urgente: cancellare una nave dallo storico dello Scheduler non deve farla sparire dal
> Calendario storico ne dallo storico dell'Operatore.

- Aggiunti due campi booleani a `Ship`: `HiddenFromSchedulerHistory` e
  `HiddenFromOperatorHistory` (migration `AddShipHistoryVisibilityFlags`, default
  `false`).
- Nuovi endpoint, entrambi soft-delete (non toccano la riga, solo il flag):
  - `DELETE /api/ships/{id}/scheduler-history` -> imposta `HiddenFromSchedulerHistory`.
  - `DELETE /api/ships/{id}/operator-history` -> imposta `HiddenFromOperatorHistory`.
- `GET /api/ships` continua a restituire **tutte** le navi con entrambi i flag: ogni
  pagina decide da sola cosa nascondere.
  - Lo storico dello Scheduler (tabella "Storico navi") filtra le navi con
    `hiddenFromSchedulerHistory`.
  - Lo storico dell'Operatore (tabella "Navi registrate") filtra le navi con
    `hiddenFromOperatorHistory`.
  - Il Calendario storico non filtra **nulla**: e la fonte di verita condivisa e ignora
    entrambi i flag.
- `DELETE /api/ships/{id}` (cancellazione reale, non piu usata dallo storico) resta solo
  per rimuovere una nave `Pending` dalla coda dello Scheduler, prima che sia mai stata
  assegnata o mostrata come evento a calendario.

## Tasto cancella nello storico Operatore

- Aggiunto un bottone "Cancella" a ogni riga della tabella "Navi registrate"
  dell'Operatore, prima assente.
- Usa lo stesso meccanismo di nascondimento isolato: chiama
  `DELETE /api/ships/{id}/operator-history`, non tocca ne il Calendario ne lo storico
  dello Scheduler.

## Login a un tasto invece di due

> Deviazione esplicita dalla [spec 07](07-ux-dashboard-storico.md), che descriveva due
> bottoni "Entra come Operatore" / "Entra come Scheduler" che sceglievano il ruolo prima
> dell'invio del form.

- `index.html` ha ora un solo bottone "Accedi". Il campo `returnUrl` nascosto viene
  valorizzato solo se l'utente arriva da un link diretto a una pagina protetta (deep
  link), non piu scelto cliccando un bottone di ruolo.
- Il server deduce il ruolo dalle credenziali stesse (`ResolveRole` in `Program.cs`),
  provando in ordine le credenziali di Operatore e Scheduler: username/password
  sbagliati per entrambi -> redirect a `/` con `error=1`, invariato.
- Se il `returnUrl` richiesto corrisponde al ruolo risolto, l'utente ci atterra
  direttamente (comportamento invariato per i deep link, es. sessione scaduta su
  `/scheduler.html`). Se non corrisponde (es. credenziali Operatore ma `returnUrl`
  puntava a `/scheduler.html`), l'utente atterra sulla pagina di default del proprio
  ruolo invece che su una pagina per cui non e autorizzato.

## Calendario: piu informazioni per giorno, stato di ogni banchina

- Nella griglia mensile, i due pallini colorati (arrivi/partenze) sono sostituiti da
  due badge numerici: `↓N` (arrivi) e `↑N` (partenze), mostrati solo se `N > 0`.
- Aggiunta una riga "`X/Y banchine`" in fondo a ogni cella, con il conteggio delle
  banchine occupate quel giorno sul totale fisso di 8; diventa in evidenza (colore
  "occupata") quando il terminal e pieno (`X == Y`).
- Il pannello di dettaglio (click su un giorno) non mostra piu solo le banchine
  occupate ("Banchine occupate"): ora elenca **tutte** le banchine del terminal con lo
  stato Libera/Occupata (stessa pillola visiva usata nello Scheduler) e la nave
  presente, se occupata. Rinominato in "Stato banchine".
- Nessun nuovo endpoint dedicato: i conteggi si calcolano lato client da
  `GET /api/ships` (gia usato) e dall'elenco statico banchine ottenuto una volta da
  `GET /api/berths` (nome e taglia, non lo stato "oggi" che e relativo al giorno reale
  dell'app, non al giorno selezionato nel calendario).

## Icone dei bottoni circolari

- I glifi Unicode usati nei bottoni icona (hamburger `☰`, chevron `‹`, freccia `←`,
  luna/sole per il tema) risultavano visibilmente decentrati nel cerchio: dipende dai
  font di fallback usati da Windows per questi simboli, che non hanno il glifo centrato
  nel proprio riquadro em.
- Sostituiti con SVG inline (`stroke="currentColor"`, dimensione fissa 16x16),
  centrati in modo esatto dal flexbox gia presente su `.icon-button`. Le icone
  sole/luna sono condivise in `Theme.icons` (`theme.js`) e usate da tutte le pagine
  tramite `innerHTML` invece di `textContent`.

## Transizione tema chiaro/scuro

- Il cambio tema passava da chiaro a scuro (o viceversa) in un solo frame, percepito
  come uno sfarfallio netto.
- `Theme.toggle()` ora aggiunge temporaneamente una classe `theme-transition` a
  `<html>` (rimossa dopo ~250ms) che anima `background-color`, `color`,
  `border-color` e `box-shadow` con una transizione morbida; il caricamento iniziale
  della pagina resta istantaneo (la classe non e presente al primo render, quindi
  nessun flash quando il tema salvato viene applicato in `<head>`).

## Bug corretti durante l'implementazione

- **Cache del CSS.** Il foglio di stile e servito con un parametro di versione
  (`style.css?v=issue-NN`) per forzare il browser a scaricare la versione aggiornata:
  dimenticare di incrementarlo dopo aver modificato `style.css` lascia il browser a
  usare la versione in cache, quindi nessuna delle modifiche visive risulta visibile
  finche non si alza il numero di versione. Successo durante questa stessa sessione:
  la prima versione del calendario aggiornato non si vedeva per questo motivo.
- **Database locale disallineato dopo una migration.** Su questa macchina (Windows
  ARM64 emulato, vedi nota nel [diario sessione 06](../diario/diario-sessione-06.md))
  il database locale usa SQLite con `EnsureCreated()`, non le migration EF: se il file
  del database esiste gia, `EnsureCreated()` non aggiunge le colonne di una migration
  successiva. Dopo aver aggiunto `HiddenFromSchedulerHistory`/
  `HiddenFromOperatorHistory`, un ripristino del database locale da un backup
  precedente ha lasciato lo schema vecchio con il codice nuovo: ogni lettura/scrittura
  di una nave falliva (colonna non trovata), quindi anche la creazione di una nave
  sembrava non funzionare piu. Corretto aggiungendo le due colonne mancanti al database
  locale esistente, senza perdere i dati di prova gia presenti. Su SQL Server (uso
  previsto, non questa macchina) il problema non si presenta: `Database.Migrate()`
  applica le migration mancanti automaticamente all'avvio.

## Cosa non facciamo

- nessuna modifica alle regole di dominio (creazione nave, assegnazione, Next Day);
- nessuna cancellazione reale di una nave gia registrata dagli storici di pagina: solo
  nascondimento locale alla pagina, tramite i due nuovi flag;
- nessun sistema di autenticazione reale: resta un cookie di ruolo con credenziali
  demo hardcoded, solo la UI di login e cambiata da due bottoni a uno.

## File coinvolti (riepilogo)

| Area | File |
|---|---|
| Backend | `Domain/Ship.cs` (due nuovi campi bool) |
| Backend | `Controllers/BlueHarborController.cs` (due nuovi endpoint, proiezione `GetShips` estesa) |
| Backend | `Program.cs` (`ResolveRole`, `DefaultPageForRole`, login a un tasto) |
| Backend (nuova) | `Migrations/*_AddShipHistoryVisibilityFlags.cs` |
| Frontend | `wwwroot/api.js` (`hideFromSchedulerHistory`, `hideFromOperatorHistory`) |
| Frontend | `wwwroot/scheduler.js` (storico filtra `hiddenFromSchedulerHistory`) |
| Frontend | `wwwroot/app.js` (nuovo bottone Cancella, filtra `hiddenFromOperatorHistory`) |
| Frontend | `wwwroot/calendar.html` + `calendar.js` (badge arrivi/partenze, griglia stato banchine) |
| Frontend | `wwwroot/index.html` + `login.js` (un solo bottone "Accedi") |
| Frontend | `wwwroot/theme.js` (icone SVG condivise, `theme-transition`) |
| Frontend | `wwwroot/calendar.html`, `operator.html`, `scheduler.html` (icone SVG al posto dei glifi Unicode) |
| Frontend | `wwwroot/style.css` (badge calendario, griglia stato banchine, `.theme-transition`, versione cache-busting) |

## Verifica attesa

1. Cancellare una nave dallo storico dello Scheduler non la fa sparire dal Calendario
   ne dallo storico dell'Operatore, e viceversa per l'Operatore.
2. La pagina di login mostra un solo bottone "Accedi"; le stesse credenziali demo
   portano sempre allo stesso ruolo, indipendentemente dalla pagina da cui si e
   arrivati al login.
3. Il calendario mostra, per ogni giorno del mese, il conteggio di arrivi/partenze (se
   presenti) e il rapporto banchine occupate/totali.
4. Il dettaglio giorno elenca tutte le 8 banchine con stato Libera/Occupata.
5. I bottoni icona (hamburger, chevron, freccia indietro, tema) mostrano un'icona SVG
   centrata nel cerchio, non un glifo Unicode.
6. Cambiare tema chiaro/scuro dissolve i colori invece di un cambio a scatto.
