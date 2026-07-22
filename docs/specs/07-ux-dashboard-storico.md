# Spec 07 - Login unico, dashboard, storico e feedback UX

> Stato: **implementata** - Slice: navigazione, storico e usabilita - Fonte di verita del dominio: [Commessa.md](../Commessa.md)

## Obiettivo

Rendere l'app piu semplice da usare senza cambiare le regole di dominio: un solo punto
di accesso, una sidebar di navigazione, tema chiaro/scuro, uno storico consultabile a
calendario, e un feedback visivo chiaro per ogni azione.

## Login unico e logout

Sostituisce, per la parte di interfaccia, quanto descritto in
[spec 02](02-auth-pagine-ruolo.md).

- `index.html` e `login.html` sono state unificate in un'unica pagina di login: un solo
  campo utente/password, due bottoni "Entra come Operatore" / "Entra come Scheduler" che
  impostano il `returnUrl` prima di inviare il form a `POST /login`.
- Aggiunto logout (`POST /logout`, cancella il cookie di ruolo) con un banner di conferma
  che si attiva solo al click sul bottone Logout, non al caricamento della pagina.
- Nota: la spec 02 descriveva Basic Auth; l'implementazione attuale usa un cookie di
  ruolo protetto da `IDataProtector` con form di login. Le credenziali demo restano
  invariate (`operator`/`operator`, `admin`/`admin`).

## Sidebar di navigazione (dashboard)

- Le pagine autenticate (Operatore, Scheduler, Calendario) condividono una sidebar
  fissa: brand, ruolo, data corrente reale, link di navigazione, tema, azioni di pagina.
- La sidebar e a scomparsa. Un bottone nell'header, **fuori** dalla sidebar, la riapre
  quando e chiusa, ed e visibile solo in quello stato. Un bottone **dentro** la sidebar
  la richiude. Non esiste un secondo bottone di chiusura fuori dalla sidebar.
- Operatore e Scheduler non si linkano piu a vicenda: niente scorciatoie dirette da una
  pagina di ruolo all'altra. L'unico ponte tra i due e la sezione Calendario, condivisa.

## Tema chiaro/scuro

- Preferenza salvata in `localStorage`, applicata subito al caricamento pagina (script
  in `<head>`, prima del foglio di stile) per evitare il flash del tema sbagliato.
- Presente anche nella pagina di login, sempre in piccolo e nella stessa posizione delle
  altre pagine (in basso a sinistra), pur non avendo la login una sidebar: usa uno stile
  proprio con sfondo scuro, cosi il contrasto regge in entrambi i temi.

## Storico a calendario

- Nuova pagina `calendar.html`, raggiungibile da Operatore e Scheduler (e viceversa),
  sola lettura.
- Calendario mensile: pallino verde nei giorni con arrivi, rosso nei giorni con partenze;
  click su un giorno apre il dettaglio (arrivi, partenze, banchine occupate quel giorno),
  anche per navi ormai `Departed`.
- Nessun nuovo endpoint dedicato: il calendario e calcolato interamente lato client a
  partire da `GET /api/ships`, gia esistente.
- Il calendario si apre di default sul **mese del giorno virtuale corrente dell'app**
  (`Dates.fromVirtualDay(state.currentDay)`), non sul mese reale del computer.
  Bug corretto durante lo sviluppo: il calendario si apriva sul mese reale del
  browser/computer, quasi sempre vuoto, perche il tempo dell'app parte dal 1 giugno 2026
  e avanza solo con `Next Day` — dava l'impressione che lo storico non funzionasse.
- Il link per tornare indietro (testo nella sidebar + icona nell'header) punta solo alla
  pagina Operatore o Scheduler da cui si e aperto il calendario in quella sessione del
  browser (`sessionStorage`), non a entrambe.

## Assegnazione banchina: scelta manuale dello Scheduler

> Deviazione esplicita dalla [spec 05](05-banchine.md), su richiesta del committente.

- La spec 05 prevedeva assegnazione automatica: il sistema sceglieva da solo la prima
  banchina compatibile disponibile, in un ordine fisso (`XL-1`, `L-1`, `M-1`, `M-2`, ...).
- Ora lo Scheduler sceglie a mano la banchina tra quelle compatibili per taglia, mostrate
  con l'indicazione "libera ora" o "libera dal [data]" (nuovo endpoint
  `GET /api/ships/{id}/available-berths`).
- Le regole di dominio restano invariate e sono validate server-side, non solo in UI:
  - la banchina scelta deve essere compatibile per taglia, altrimenti `400`;
  - se non e libera esattamente al giorno richiesto, il sistema la assegna comunque al
    primo slot libero **su quella banchina** (stesso comportamento "spostato" della
    spec 05, ma confinato alla banchina scelta a mano invece che a tutte le banchine
    compatibili).
- Non e una pianificazione automatica ne un'ottimizzazione: la scelta di quale banchina
  usare resta una decisione umana dello Scheduler, coerente con "Fuori dallo scope"
  della commessa.

## Editing Operatore prima dell'assegnazione

- L'Operatore puo correggere nome e note di una nave `Pending` direttamente in tabella
  (nuovo endpoint `PATCH /api/ships/{id}`).
- Il backend rifiuta la modifica con `409` se la nave non e piu `Pending`: rispetta la
  regola della commessa "niente modifiche o riassegnazioni dopo l'assegnazione".

## Giorno virtuale mai mostrato nel frontend

- Il giorno virtuale (`AppState.CurrentDay`, `RequestedArrivalDay`,
  `BerthAssignment.StartDay`) resta l'unica fonte di verita nel database e nella logica
  di dominio: **nessuna modifica al modello dati o alle regole**.
- Il frontend non mostra mai il numero di giorno grezzo (niente piu "Giorno N" in
  nessuna pagina): solo date reali calcolate da un giorno base fisso (`dates.js`,
  `BaseDate = 2026-06-01`), sia per "oggi" che per arrivi e partenze.

## Feedback visivi

- Notifiche toast (successo/errore) per ogni azione che chiama il server: creazione
  nave, modifica, assegnazione, cancellazione, avanzamento giorno.
- I bottoni che avviano un'azione asincrona si disabilitano e mostrano un'etichetta di
  stato ("Registrazione...", "Assegnazione...", ecc.) finche la richiesta non e
  completata.
- Il bottone per generare un arrivo dal faro e stato rinominato da
  "Nuovo arrivo dal faro" a "Nuovo arrivo" e spostato dentro il pannello
  "Registra una nave": si nasconde quando appare il form con i dati del faro, e
  ricompare quando la nave viene creata (il form si richiude).
- Le caselle Note non sono piu ridimensionabili dall'utente.

## Bug corretti durante l'implementazione

Piu di un bug e nato dalla stessa causa: regole CSS generiche (`form { display: grid }`,
`.dialog-overlay { display: grid }`, `.icon-button { display: inline-flex }`) impostano
`display` su elementi che a volte hanno l'attributo HTML `hidden`. Le regole d'autore
vincono sempre sullo stile predefinito del browser per `[hidden]`, quindi senza un
override esplicito questi elementi restavano visibili anche quando JavaScript li
marcava `hidden`. Corretto aggiungendo `form[hidden]`, `.dialog-overlay[hidden]` e
`.icon-button[hidden]` con `display: none` in `style.css`.

Effetti pratici prima della correzione:

- il banner di conferma logout appariva subito al caricamento della pagina, non solo al
  click sul bottone Logout;
- dopo aver creato una nave, il form con i dati del faro restava visibile con i dati
  della nave appena creata, dando l'impressione di poter registrare sempre la stessa
  nave;
- l'icona "torna indietro" nel calendario sarebbe rimasta visibile anche senza sapere
  da dove tornare.

Un secondo bug, non legato a CSS: il bottone "Aggiorna" nella sidebar usava lo stile
`.secondary` pensato per sfondi chiari, ma la sidebar e sempre scura in entrambi i temi;
in tema chiaro il testo scuro spariva su sfondo scuro. Corretto con una regola piu
specifica che forza i colori "chiari" quando quel bottone vive nella sidebar.

## Cosa non facciamo

- nessuna modifica al modello dati o alla logica del giorno virtuale;
- nessuna riassegnazione o modifica di navi gia `Assigned`;
- nessuna pianificazione automatica: la scelta della banchina resta una decisione dello
  Scheduler;
- nessun sistema di autenticazione reale (restano credenziali demo hardcoded).

## File coinvolti (riepilogo)

| Area | File |
|---|---|
| Backend | `Program.cs`, `Controllers/BlueHarborController.cs`, `Services/BerthSchedulerService.cs` |
| Backend (nuovi) | `Contracts/AssignShipRequest.cs`, `Contracts/AvailableBerthResponse.cs`, `Contracts/UpdateShipRequest.cs` |
| Frontend | `wwwroot/index.html` (login unico, sostituisce anche `login.html`, eliminato) |
| Frontend | `wwwroot/operator.html` + `app.js`, `wwwroot/scheduler.html` + `scheduler.js` |
| Frontend (nuovi) | `wwwroot/calendar.html` + `calendar.js` |
| Frontend (nuovi, condivisi) | `wwwroot/dates.js`, `theme.js`, `sidebar.js`, `logout.js`, `toast.js` |
| Frontend | `wwwroot/api.js` (esteso), `wwwroot/style.css` (token colore, sidebar, dark mode, dialog, toast) |

## Verifica attesa

1. Login con un solo campo utente/password porta al ruolo scelto in base al bottone.
2. Logout richiede conferma (banner) solo dopo il click, mai al caricamento pagina.
3. La sidebar si apre/chiude; il bottone esterno compare solo a sidebar chiusa.
4. Il calendario mostra arrivi e partenze anche per navi `Departed`, aprendosi di
   default sul mese del giorno virtuale corrente, non su quello reale del computer.
5. Lo Scheduler puo scegliere solo tra banchine compatibili per taglia; il backend
   rifiuta banchine incompatibili con `400`.
6. L'Operatore non puo modificare una nave dopo l'assegnazione (`409`).
7. Nessun testo in nessuna pagina mostra mai "Giorno N": solo date reali.
8. Ogni azione (creazione, modifica, assegnazione, cancellazione, next day) mostra un
   toast di esito, positivo o negativo.
9. Il tema chiaro/scuro e leggibile ovunque, sidebar compresa, in entrambe le modalita.
