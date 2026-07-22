# Diario - Sessione 08 (2026-07-22)

## Obiettivo

Aggiungere un tasto di assistenza presente su tutte le pagine, che apra una
piccola finestra con un menu a tendina per scegliere il tipo di problema e un
campo facoltativo per descriverlo meglio. Richiesto esplicitamente: opzioni
diverse tra la pagina di login (problemi di accesso) e le pagine autenticate
(problemi con le funzioni dell'app), nessun campo email (uso interno a una sola
azienda).

## Decisioni prese col committente

- Prima di implementare, chiesto se le segnalazioni dovessero essere salvate da
  qualche parte (es. tabella nel database) oppure bastasse una conferma a
  schermo. Risposta: **solo conferma a schermo**, nessuna persistenza. Questo ha
  evitato di introdurre una nuova entita, una migration e un endpoint non
  richiesti.

## Cosa abbiamo fatto

- Nuovo script `wwwroot/support.js`, incluso in tutte e 4 le pagine: costruisce
  via JavaScript un tasto "?" e una finestra di dialogo (stesso stile del dialog
  di conferma logout gia esistente), senza duplicare markup HTML in ogni pagina.
- Menu a tendina con categorie diverse in base al contesto: problemi di accesso
  sul login, problemi di funzionamento sulle pagine autenticate (operator,
  scheduler, calendar).
- All'invio: nessuna chiamata di rete, solo chiusura della finestra e un toast di
  conferma (riusa `Toast` gia esistente; aggiunto `toast.js` a `index.html`, che
  prima non lo includeva).
- Aggiornata la versione di cache-busting di `style.css` (`issue-08` ->
  `issue-09`) dopo le nuove regole CSS per il tasto e la finestra.

Dettagli completi e file coinvolti: [spec 09](../specs/09-tasto-assistenza.md).

## Bug trovati e corretti

- **Tasto sovrapposto al bottone "Aggiorna" nella sidebar.** Prima versione: tasto
  con `position: fixed` in basso a sinistra su tutte le pagine. Su
  operator/scheduler/calendar questo lo faceva finire sovrapposto al bottone
  "Aggiorna" (e "Next Day" nello Scheduler) gia presente nel footer della
  sidebar, segnalato dal committente dopo aver visto la prima versione in
  esecuzione. Corretto facendo inserire il tasto, quando la pagina ha una
  sidebar, nel flusso normale del footer subito dopo il toggle tema, invece che
  come elemento flottante fuori dal flusso. Il posizionamento flottante resta
  solo sulla pagina di login, che non ha sidebar.

## Verifiche

- Flussi verificati end-to-end con l'app avviata realmente (SQLite locale),
  usando un browser headless (Playwright) con screenshot reali, non solo lettura
  del codice:
  - pagina di login: tasto visibile, apertura del dialog, categorie corrette,
    invio che chiude il dialog e mostra il toast di conferma;
  - login come operatore: categorie del menu diverse rispetto al login, dialog
    apribile e annullabile;
  - dopo la correzione del bug di sovrapposizione: verificata via bounding box
    (Playwright) l'assenza di sovrapposizione tra tasto assistenza e bottone
    "Aggiorna" sulla pagina Operatore, e controllate a schermo le pagine
    Operatore, Scheduler (con "Next Day" in piu nel footer) e Calendario (senza
    "Aggiorna").
- Server di test avviato e poi arrestato al termine delle verifiche.
- Nessun commit ne push eseguito: le modifiche restano nel working tree.

## Evidenze

Documento di dettaglio: [../specs/09-tasto-assistenza.md](../specs/09-tasto-assistenza.md)
