# Diario - Sessione 07 (2026-07-20)

## Obiettivo

Lavorare sulla lista di suggerimenti raccolti durante i test manuali
(`docs/suggestion.md`), tranne la scelta del logo (lasciata al committente): calendario
piu grafico, pulsanti con icone centrate, cambio tema senza flash, storico dello
Scheduler separato dal Calendario (segnalato come urgente), tasto cancella nello
storico dell'Operatore, login a un solo tasto.

## Cosa abbiamo fatto

Storico separato per ruolo (URGENTE):

- Aggiunti due campi booleani a `Ship` (`HiddenFromSchedulerHistory`,
  `HiddenFromOperatorHistory`) con relativa migration EF Core.
- Nuovi endpoint `DELETE /api/ships/{id}/scheduler-history` e
  `DELETE /api/ships/{id}/operator-history`: nascondono la nave solo nella pagina che
  ha chiesto la cancellazione, senza toccare la riga nel database. Il Calendario
  storico continua a leggere tutte le navi, ignorando entrambi i flag.
- Aggiunto un bottone "Cancella" alla tabella "Navi registrate" dell'Operatore, che
  prima non lo aveva.

Login:

- Da due bottoni ("Entra come Operatore" / "Entra come Scheduler") a un solo bottone
  "Accedi": il server deduce il ruolo dalle credenziali (`ResolveRole` in
  `Program.cs`), non piu da quale bottone e stato premuto.

Calendario:

- Sostituiti i pallini arrivi/partenze nella griglia mensile con badge numerici
  (`↓N`/`↑N`) e un conteggio "banchine occupate/totali" per ogni giorno.
- Il pannello di dettaglio (click su un giorno) ora elenca lo stato di **tutte** le 8
  banchine (Libera/Occupata + nave), non solo quelle occupate.

Rifiniture UX:

- Le icone dei bottoni circolari (hamburger, chevron, freccia indietro, tema) erano
  glifi Unicode visibilmente decentrati nel cerchio: sostituiti con SVG inline
  centrati esattamente dal flexbox gia presente.
- Il cambio tema chiaro/scuro passava da un colore all'altro in un solo frame
  (sfarfallio): aggiunta una transizione morbida temporanea (~250ms) solo durante il
  cambio, non al caricamento pagina.

Dettagli completi e file coinvolti: [spec 08](../specs/08-storico-separato-login-unico.md).

## Bug trovati e corretti

- **Cache del CSS non invalidata.** Il primo giro di modifiche al calendario non era
  visibile in browser: `style.css` viene servito con `?v=issue-NN` per forzare il
  refresh della cache, ma il numero non era stato incrementato dopo aver modificato il
  foglio di stile, quindi il browser continuava a servire la versione vecchia dalla
  cache. Corretto alzando il numero di versione a ogni modifica CSS di questa sessione
  (`issue-07`, poi `issue-08`).
- **Database locale disallineato dopo la migration.** Dopo aver aggiunto le due nuove
  colonne a `Ship`, il database SQLite locale (usato su questa macchina, vedi nota nel
  [diario sessione 06](diario-sessione-06.md)) era stato ripristinato da un backup con
  lo schema precedente: `EnsureCreated()` non altera uno schema gia esistente, quindi
  ogni lettura/scrittura di una nave falliva per colonna mancante, e la creazione di
  una nuova nave sembrava non funzionare piu. Corretto aggiungendo le due colonne
  mancanti al database esistente (senza perdere le navi di prova gia registrate). Su
  SQL Server il problema non si presenta, perche `Database.Migrate()` applica le
  migration mancanti automaticamente a ogni avvio.

## Verifiche

- Build completata con `0 errori` dopo ogni modifica al backend.
- Migration `AddShipHistoryVisibilityFlags` generata contro SQL Server (provider di
  riferimento), non contro l'override locale SQLite, per evitare che finissero nella
  migration alterazioni di colonna specifiche di SQLite.
- Flussi verificati end-to-end con un'app avviata realmente (non solo lettura del
  codice):
  - via `curl`: login con credenziali sbagliate/giuste, deep link a una pagina non
    coerente col ruolo risolto, creazione nave, nascondimento da uno storico con
    verifica che la nave resti visibile altrove;
  - via browser headless con screenshot reali: vista mensile del calendario con badge
    e conteggio banchine, pannello di dettaglio con lo stato di tutte le banchine,
    icone dei bottoni centrate.
- Nessun commit ne push eseguito: le modifiche restano nel working tree.

## Evidenze

Documento di dettaglio: [../specs/08-storico-separato-login-unico.md](../specs/08-storico-separato-login-unico.md)
