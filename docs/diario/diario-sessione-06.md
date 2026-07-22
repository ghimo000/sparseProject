# Diario - Sessione 06 (2026-07-20)

## Obiettivo

Rendere l'app piu semplice da usare in vista dei test manuali: login unico, dashboard
di navigazione, tema chiaro/scuro, storico consultabile a calendario, assegnazione
banchina scelta dallo Scheduler invece che automatica, e feedback visivo per ogni
azione. Sessione svolta interamente in locale su SQLite (vedi nota in fondo), senza
commit ne push.

## Cosa abbiamo fatto

Login e accesso:

- Unificate `index.html` e `login.html` in un'unica pagina di login con un solo campo
  utente/password e due bottoni per scegliere il ruolo.
- Aggiunto logout (`POST /logout`) con banner di conferma, attivo solo al click sul
  bottone Logout.
- Aggiunto il toggle tema chiaro/scuro anche nella pagina di login, in basso a sinistra.

Navigazione e dashboard:

- Aggiunta una sidebar di navigazione condivisa da Operatore, Scheduler e Calendario:
  brand, ruolo, data reale corrente, link di navigazione, tema, logout.
- Resa la sidebar a scomparsa: un bottone nell'header (fuori) la riapre solo quando e
  chiusa; un bottone dentro la sidebar la richiude. Rimosso un secondo bottone di
  chiusura che inizialmente era finito anche fuori dalla sidebar.
- Rimossi i link incrociati tra Operatore e Scheduler: l'unico ponte tra i due ruoli
  resta la sezione Calendario.
- Spostato dentro il pannello "Registra una nave" il bottone per generare un arrivo dal
  faro, rinominato in "Nuovo arrivo": si nasconde quando appare il form, ricompare alla
  creazione della nave.

Storico a calendario:

- Nuova pagina `calendar.html` con calendario mensile (pallini per arrivi/partenze,
  dettaglio al click su un giorno), calcolato lato client da `GET /api/ships`, nessun
  nuovo endpoint dedicato.
- Aggiunto un link/icona "torna indietro" che ricorda, per la sessione del browser, da
  quale pagina di ruolo si e aperto il calendario.

Assegnazione banchina e editing:

- Cambiata l'assegnazione da automatica a scelta manuale dello Scheduler tra le
  banchine compatibili per taglia (nuovo endpoint `GET /api/ships/{id}/available-berths`,
  `POST /api/ships/{id}/assign` ora riceve la banchina scelta nel corpo). Deviazione
  esplicita dalla spec 05, documentata nella nuova spec 07.
- Aggiunta la modifica di nome/note per le navi Operatore, permessa solo mentre la nave
  e `Pending` (nuovo endpoint `PATCH /api/ships/{id}`, `409` altrimenti).
- Tolto ovunque nel frontend il numero di giorno virtuale grezzo: solo date reali
  calcolate da una base fissa (`dates.js`), incluso il calendario.

Feedback visivi:

- Aggiunte notifiche toast di successo/errore per ogni azione che chiama il server.
- I bottoni che avviano un'azione asincrona si disabilitano con un'etichetta di stato
  finche la richiesta non e completata.
- Tolto il resize manuale dalle caselle Note.

## Bug trovati e corretti

- **Elementi `hidden` che restavano visibili.** Tre punti diversi (`form`,
  `.dialog-overlay`, `.icon-button`) avevano regole CSS che impostavano `display`
  esplicitamente, e questo vinceva sempre sullo stile predefinito del browser per
  l'attributo `hidden`. Effetto pratico: il banner di conferma logout appariva subito
  al caricamento invece che solo al click; dopo aver creato una nave il form con i dati
  del faro restava visibile con i dati vecchi, dando l'impressione di poter registrare
  sempre la stessa nave; l'icona "torna indietro" nel calendario sarebbe rimasta
  visibile senza un contesto valido. Corretto con override `[hidden] { display: none }`
  mirati.
- **Testo invisibile in tema chiaro.** Il bottone "Aggiorna" nella sidebar usava lo
  stile `.secondary` (testo scuro, pensato per sfondi chiari), ma la sidebar e sempre
  scura in entrambi i temi: in tema chiaro il testo spariva. Corretto con una regola
  piu specifica per i bottoni `.secondary` dentro la sidebar.
- **Calendario "vuoto".** Il calendario si apriva di default sul mese reale del
  computer, quasi sempre senza navi, perche il tempo dell'app parte dal 1 giugno 2026 e
  avanza solo con `Next Day`. Corretto allineando il mese di apertura al giorno
  virtuale corrente dell'app, non alla data reale del browser.

## Verifiche

- Build completata con `0 errori`.
- Flussi verificati end-to-end con un browser headless reale (non solo curl): login
  come Operatore e come Scheduler, logout con conferma, creazione e modifica nave,
  assegnazione manuale (sia su banchina libera subito sia su banchina occupata, con
  spostamento al primo slot libero), rifiuto di banchina incompatibile (`400`) e di
  modifica dopo assegnazione (`409`), calendario con nave arrivata/partita ancora
  visibile dopo `Departed`, tema chiaro/scuro su tutte le pagine incluso login.
- Nessun commit ne push eseguito: le modifiche restano nel working tree.

## Nota su SQL Server e SQLite locale

Questa macchina di sviluppo e Windows ARM64 emulato: il motore SQL Server nativo (x64)
non carica correttamente sotto emulazione. Per poter testare in locale si usa un
override non versionato (`app/BlueHarbor.Api/appsettings.Local.json`, escluso da Git)
che fa passare l'app a SQLite tramite `Database:Provider = Sqlite`. Su SQLite il
database viene creato con `EnsureCreated()` direttamente dal modello corrente, non con
le migration EF (scritte per SQL Server): scelta locale a questa macchina, non un
cambiamento di comportamento per chi usa SQL Server.

## Evidenze

Documento di dettaglio: [../specs/07-ux-dashboard-storico.md](../specs/07-ux-dashboard-storico.md)
