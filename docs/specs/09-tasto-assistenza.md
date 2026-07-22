# Spec 09 - Tasto di assistenza su tutte le pagine

> Stato: **implementata** - Slice: usabilita - Fonte di verita del dominio: [Commessa.md](../Commessa.md)

## Obiettivo

Dare a operatore, scheduler e utente non ancora autenticato un modo rapido per
segnalare un problema di funzionamento dell'applicazione, senza dover contattare
qualcuno fuori dall'app. Richiesta esplicita: nessun campo email o simili (uso
interno a una sola azienda), opzioni del menu a tendina diverse tra la pagina di
login (problemi di accesso) e le pagine autenticate (problemi con le funzioni
dell'app), nessun'altra modifica alle regole di dominio.

## Cosa fa

- Un tasto "?" presente su tutte le pagine (`index.html`, `operator.html`,
  `scheduler.html`, `calendar.html`) apre una piccola finestra sopra la pagina
  corrente, con lo stesso stile del dialog di conferma logout gia esistente
  (`.dialog-overlay` / `.dialog-panel`).
- Il modulo ha due campi: un menu a tendina obbligatorio con il tipo di problema e
  un campo di testo facoltativo per descriverlo meglio (max 500 caratteri).
- Le opzioni del menu cambiano in base al contesto (vedi `support.js`):
  - **Login** (nessuna sidebar in pagina): problemi legati all'accesso
    (credenziali, pagina di login che non carica, cambio tema che non funziona).
  - **Pagine autenticate**: problemi legati al funzionamento delle funzioni
    dell'app (pagina bloccata, dato non aggiornato, pulsante che non risponde,
    errore di salvataggio).
- All'invio non viene chiamato nessun endpoint: il modulo si chiude e appare un
  toast di conferma ("Richiesta inviata..."). Decisione esplicita, confermata con
  il committente: **nessuna persistenza**, la richiesta non viene salvata da
  nessuna parte. Se in futuro serve tracciarle, va aggiunta una tabella dedicata e
  un endpoint `POST` (fuori da questo giro).

## Perche' un unico `support.js` invece di markup duplicato in ogni pagina

Le altre finestre di dialogo del progetto (es. conferma logout) hanno il markup
duplicato in ogni pagina HTML che le usa. Per il tasto di assistenza si e scelto
invece di costruire pulsante e dialog via JavaScript (`document.createElement`) e
includere un solo script (`<script src="support.js"></script>`) in tutte le
pagine: il contenuto del menu a tendina dipende dal contesto (login vs pagina
autenticata) ed e piu semplice mantenere quella logica in un punto solo invece che
sincronizzarla a mano in 4 file HTML.

## Posizionamento del tasto (e bug corretto durante l'implementazione)

- Prima versione: tasto con `position: fixed` in basso a sinistra su tutte le
  pagine, sullo stesso modello del toggle tema flottante del login
  (`.theme-toggle-floating`).
- **Bug**: sulle pagine con sidebar (operator/scheduler/calendar) il tasto
  flottante finiva sovrapposto al bottone "Aggiorna" (e "Next Day" nello
  Scheduler) gia presente nel footer della sidebar, perche entrambi occupano la
  stessa zona basso-sinistra dello schermo ma uno e fuori dal flusso della pagina
  e l'altro dentro.
- **Correzione**: `support.js` rileva se la pagina ha una sidebar
  (`document.querySelector(".sidebar-footer")`):
  - se si', il tasto viene inserito nel flusso normale del footer, subito dopo il
    toggle tema (`icon-button theme-toggle`), cosi si impila ordinatamente sopra
    "Aggiorna"/"Next Day" invece di galleggiarci sopra;
  - se no (pagina di login, senza sidebar), resta `position: fixed`
    (`.support-button-floating`), impilato sopra al toggle tema esistente in
    basso a sinistra (`bottom: 4.5rem` contro `bottom: 1rem` del toggle tema).

## Cosa non facciamo

- nessuna modifica alle regole di dominio della commessa;
- nessun salvataggio della segnalazione (ne database ne log applicativo);
- nessun campo email o altro dato di contatto;
- nessuna pagina di amministrazione per consultare le segnalazioni (non ha senso
  senza persistenza).

## File coinvolti (riepilogo)

| Area | File |
|---|---|
| Frontend (nuovo) | `wwwroot/support.js` (tasto + dialog, categorie per contesto, nessuna chiamata di rete) |
| Frontend | `wwwroot/style.css` (`.support-button-floating`, `.support-dialog-panel`, versione cache-busting `issue-08` -> `issue-09`) |
| Frontend | `wwwroot/index.html` (aggiunto `toast.js`, che prima mancava, e `support.js`) |
| Frontend | `wwwroot/calendar.html`, `operator.html`, `scheduler.html` (aggiunto `support.js`) |

## Verifica attesa

1. Il tasto "?" e visibile su login, operator, scheduler e calendar.
2. Sulla pagina di login le opzioni del menu riguardano l'accesso; sulle pagine
   autenticate riguardano il funzionamento dell'app.
3. Compilare e inviare il modulo chiude la finestra e mostra un toast di conferma;
   nessuna richiesta di rete viene effettuata.
4. Il tasto "Annulla" chiude la finestra senza mostrare alcun toast.
5. Su operator, scheduler e calendar il tasto sta nel footer della sidebar, sopra
   "Aggiorna"/"Next Day", senza sovrapporsi a nessun altro controllo.
