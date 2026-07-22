# BlueHarbor - Documento architetturale

> Documento di supporto alla consegna e allo studio del progetto.
> Fonte di verita del dominio: [Commessa.md](Commessa.md).

## 1. Obiettivo dell'applicazione

BlueHarbor e una piattaforma web interna, didattica, per gestire un piccolo terminal
container.

L'applicazione permette di:

- registrare navi in arrivo;
- visualizzare e pianificare l'uso delle banchine;
- avanzare manualmente il giorno virtuale;
- separare il lavoro tra Operatore e Scheduler.

Il sistema non e real-time e non fa ottimizzazioni automatiche: le decisioni restano
manuali, come richiesto dalla commessa.

## 2. Architettura complessiva

L'applicazione segue una struttura semplice a tre livelli:

```text
[ Browser: HTML / CSS / JavaScript vanilla ]
            |
            | fetch() JSON
            v
[ ASP.NET Core Web API ]
  Controller -> Service -> DbContext
            |
            | Entity Framework Core
            v
[ SQL Server ]
```

### Frontend

Il frontend e composto da pagine statiche in `wwwroot`. Non c'e piu una homepage di sola
scelta ruolo: `index.html` e la pagina di login unica (vedi
[spec 07](specs/07-ux-dashboard-storico.md)).

- `index.html`: login unico (utente/password, un solo bottone "Accedi": il ruolo si
  deduce dalle credenziali, vedi [spec 08](specs/08-storico-separato-login-unico.md)).
- `operator.html`: pagina Operatore, con sidebar di navigazione.
- `scheduler.html`: pagina Scheduler, con sidebar di navigazione.
- `calendar.html`: storico a calendario, condiviso tra Operatore e Scheduler.
- `api.js`: punto unico per le chiamate HTTP.
- `app.js`: logica della pagina Operatore.
- `scheduler.js`: logica della pagina Scheduler.
- `calendar.js`: logica del calendario storico.
- `login.js`: logica della pagina di login.
- `dates.js`: converte il giorno virtuale in data reale per la UI (mai il numero grezzo).
- `theme.js`: applica e ricorda il tema chiaro/scuro (localStorage).
- `sidebar.js`: apre/chiude la sidebar di navigazione.
- `logout.js`: mostra il banner di conferma prima del logout effettivo.
- `toast.js`: notifiche di successo/errore per le azioni dell'utente.

Il frontend non contiene regole di dominio importanti: mostra dati, raccoglie input e
chiama le API.

### Backend

Il backend e una Web API ASP.NET Core.

- `Program.cs`: configurazione app, servizi, database, login/logout demo e file statici.
- `BlueHarborController.cs`: espone gli endpoint HTTP usati dal frontend.
- `Services/`: contiene la logica di dominio.
- `Data/BlueHarborDbContext.cs`: accesso al database tramite EF Core.
- `Domain/`: contiene le entita principali del dominio.
- `Contracts/`: contiene le richieste e risposte usate dalle API, incluse
  `AssignShipRequest`, `AvailableBerthResponse` e `UpdateShipRequest`.

### Database

La persistenza usa SQL Server tramite Entity Framework Core. Lo schema e versionato
con migration EF Core, applicate automaticamente all'avvio dell'applicazione.

Il database salva:

- le navi registrate;
- le assegnazioni delle navi alle banchine;
- il giorno virtuale corrente.

Le banchine non sono salvate in tabella: sono un elenco fisso nel codice, perche la
commessa dice che il terminal ha sempre lo stesso numero di banchine.

## 3. Componenti principali e responsabilita

### BlueHarbor.Faro

Progetto separato che simula il faro.

Responsabilita:

- generare una dimensione nave casuale;
- generare un offset di arrivo tra 0 e 30 giorni;
- generare una durata di occupazione tra 3 e 15 giorni.

### ShipRegistrationService

Responsabilita:

- registrare una nuova nave;
- calcolare il giorno di arrivo assoluto partendo dal giorno virtuale corrente;
- impostare lo stato iniziale `Pending`;
- validare il flusso di registrazione insieme al controller.

### BerthSchedulerService

Responsabilita:

- calcolare lo stato corrente delle banchine;
- mostrare eventuali prenotazioni future;
- elencare le banchine compatibili per taglia con una nave `Pending`, indicando se sono
  libere subito o da quale giorno (`GetAvailableBerthsForShipAsync`);
- assegnare una nave `Pending` alla banchina scelta dallo Scheduler
  (`AssignAsync(shipId, berthName)`), validando che sia compatibile per taglia;
- evitare sovrapposizioni tra finestre di occupazione;
- spostare la nave al primo slot libero su quella banchina se la finestra richiesta e
  occupata.

> La scelta della banchina e ora manuale (vedi [spec 07](specs/07-ux-dashboard-storico.md)),
> non piu automatica come nella [spec 05](specs/05-banchine.md): il service non sceglie
> piu da solo la prima banchina compatibile, ma valida ed esegue la scelta dello Scheduler.

### DayService

Responsabilita:

- leggere il giorno virtuale corrente;
- avanzare il giorno di una unita con `Next Day`;
- segnare come `Departed` le navi assegnate che hanno completato l'occupazione.

### BlueHarborController

Responsabilita:

- ricevere le richieste HTTP;
- chiamare il service corretto;
- restituire JSON al frontend;
- mantenere il controller leggero, senza concentrare qui la logica di dominio.

## 4. Modello dati ad alto livello

### Ship

Rappresenta una nave registrata nel sistema.

Campi principali:

- `Id`: identificativo database.
- `Name`: nome inserito dall'Operatore.
- `Notes`: note opzionali.
- `Size`: dimensione nave (`S`, `M`, `L`, `XL`).
- `RequestedArrivalDay`: giorno virtuale di arrivo richiesto, immutabile.
- `OccupationDays`: durata occupazione.
- `Status`: stato nave (`Pending`, `Assigned`, `Departed`).
- `HiddenFromSchedulerHistory`: nasconde la nave solo dallo storico dello Scheduler
  (vedi [spec 08](specs/08-storico-separato-login-unico.md)).
- `HiddenFromOperatorHistory`: nasconde la nave solo dallo storico dell'Operatore
  (vedi [spec 08](specs/08-storico-separato-login-unico.md)).

Gli ultimi due campi sono un nascondimento locale alla pagina, non una cancellazione:
`GET /api/ships` restituisce sempre tutte le navi con entrambi i flag; il Calendario
storico li ignora entrambi, perche resta la fonte di verita condivisa tra i due ruoli.

### BerthAssignment

Rappresenta l'assegnazione persistita di una nave a una banchina.

Campi principali:

- `Id`: identificativo database.
- `ShipId`: chiave esterna verso `Ships`; ha un indice univoco.
- `BerthName`: nome della banchina assegnata, per esempio `M-1`.
- `StartDay`: primo giorno virtuale di occupazione.

La relazione e uno-a-zero-o-uno: una nave puo non avere un'assegnazione oppure averne
una sola. Eliminando una nave viene eliminata anche la relativa assegnazione (`CASCADE`).

### AppState

Contiene lo stato globale minimo dell'applicazione.

Campi principali:

- `Id`: sempre 1.
- `CurrentDay`: giorno virtuale corrente.

### Berth

Rappresenta una banchina del terminal.

Non viene salvata nel database. L'elenco e fisso nel codice:

- `XL-1`
- `L-1`
- `M-1`, `M-2`
- `S-1`, `S-2`, `S-3`, `S-4`

Ogni banchina puo ospitare solo navi della propria dimensione.

### Tabelle tecniche

`__EFMigrationsHistory` e gestita da Entity Framework Core e registra quali migration
sono gia state applicate. Non contiene dati di dominio.

## 5. Flusso logico dell'applicazione

### Accesso

1. L'utente apre `index.html`: un solo campo utente/password e un solo bottone
   "Accedi" (vedi [spec 08](specs/08-storico-separato-login-unico.md); in origine, per
   la [spec 07](specs/07-ux-dashboard-storico.md), c'erano due bottoni che sceglievano
   il ruolo prima dell'invio).
2. Il form invia `POST /login`.
3. Il server deduce il ruolo dalle credenziali stesse (`ResolveRole`), provando in
   ordine quelle di Operatore e Scheduler; nessuna corrispondenza -> redirect a `/` con
   `error=1`.
4. Il server crea un cookie di ruolo (protetto con `IDataProtector`, non Basic Auth).
5. L'utente viene reindirizzato alla pagina richiesta se coerente con il ruolo appena
   risolto (deep link), altrimenti alla pagina di default di quel ruolo.

Credenziali demo:

| Ruolo | Utente | Password |
|---|---|---|
| Operatore | `operator` | `operator` |
| Scheduler | `admin` | `admin` |

### Logout

1. L'utente clicca "Logout" (in alto a destra su Operatore, Scheduler e Calendario).
2. Compare un banner di conferma: solo confermando si procede davvero.
3. Il form invia `POST /logout`, che cancella il cookie di ruolo e reindirizza a `/`.

### Flusso Operatore

L'Operatore registra le navi e consulta lo stato.

Caricamento pagina:

1. `operator.html` carica `api.js` e `app.js`.
2. La pagina chiama:
   - `GET /api/state`
   - `GET /api/ships`
   - `GET /api/berths`
3. Vengono mostrati giorno corrente, storico navi e banchine in sola lettura.

Registrazione nave:

1. L'Operatore preme `Nuovo arrivo`, dentro il pannello "Registra una nave" (il bottone
   si nasconde per lasciare spazio al form).
2. Il frontend chiama `POST /api/arrivals`.
3. Il faro genera dimensione, offset di arrivo e durata; la UI mostra una data reale
   d'arrivo calcolata, mai il numero di giorno virtuale.
4. L'Operatore inserisce nome e note.
5. Il frontend chiama `POST /api/ships`.
6. Il backend crea la nave con stato `Pending`.
7. Il form si nasconde, il bottone `Nuovo arrivo` ricompare, un toast conferma l'esito,
   la pagina aggiorna elenco navi e banchine.

Modifica nave (solo se `Pending`):

1. L'Operatore preme `Modifica` sulla riga di una nave `Pending`.
2. Nome e note diventano campi modificabili in tabella.
3. Il frontend chiama `PATCH /api/ships/{id}`.
4. Il backend rifiuta la modifica con `409` se la nave non e piu `Pending`.
5. Un toast conferma l'esito e la tabella si aggiorna.

Cancellazione dallo storico Operatore (vedi
[spec 08](specs/08-storico-separato-login-unico.md)):

1. L'Operatore preme `Cancella` sulla riga di una nave in "Navi registrate".
2. Il frontend chiama `DELETE /api/ships/{id}/operator-history`.
3. Il backend imposta `HiddenFromOperatorHistory`, senza rimuovere la nave: resta
   visibile nel Calendario storico e nello storico dello Scheduler.
4. Un toast conferma l'esito e la tabella si aggiorna.

Refresh manuale:

1. L'Operatore preme `Aggiorna`.
2. La pagina rilegge stato, navi e banchine.

### Flusso Scheduler

Lo Scheduler assegna banchine, cancella navi e avanza il giorno virtuale.

Caricamento pagina:

1. `scheduler.html` carica `api.js` e `scheduler.js`.
2. La pagina chiama:
   - `GET /api/state`
   - `GET /api/ships`
   - `GET /api/berths`
3. Il frontend filtra le navi `Pending` per mostrarle come assegnabili.
4. Lo storico mostra tutte le navi tranne quelle con `hiddenFromSchedulerHistory`
   (vedi [spec 08](specs/08-storico-separato-login-unico.md)).

Assegnazione nave (scelta manuale, vedi [spec 07](specs/07-ux-dashboard-storico.md)):

1. Per ogni nave `Pending`, il frontend chiama `GET /api/ships/{id}/available-berths`
   e mostra un menu a tendina con le sole banchine compatibili per taglia, etichettate
   "libera ora" o "libera dal [data]".
2. Lo Scheduler sceglie la banchina e preme `Assegna`.
3. Il frontend chiama `POST /api/ships/{id}/assign` con la banchina scelta nel corpo.
4. Il backend valida che la banchina sia compatibile per taglia (altrimenti `400`).
5. Se la finestra richiesta e libera su quella banchina, assegna la nave in quel periodo.
6. Se e occupata, cerca il primo slot libero successivo sulla stessa banchina.
7. La nave passa a `Assigned`; un toast mostra l'esito (incluso l'eventuale spostamento).
8. La pagina aggiorna navi e banchine.

Cancellazione nave dalla coda "Navi in attesa" (rimozione reale):

1. Lo Scheduler preme `Cancella` su una nave ancora `Pending`, mai assegnata.
2. Il frontend chiama `DELETE /api/ships/{id}`.
3. Il backend rimuove la nave dal database.
4. Se era assegnata, la banchina risulta libera per quella finestra (caso raro: una
   nave `Pending` non ha ancora assegnazione).
5. Un toast conferma l'esito.

Cancellazione dallo storico Scheduler (nascondimento, non rimozione reale; vedi
[spec 08](specs/08-storico-separato-login-unico.md)):

1. Lo Scheduler preme `Cancella` su una riga della tabella "Storico navi".
2. Il frontend chiama `DELETE /api/ships/{id}/scheduler-history`.
3. Il backend imposta `HiddenFromSchedulerHistory`, senza rimuovere la nave: resta
   visibile nel Calendario storico e nello storico dell'Operatore.
4. Un toast conferma l'esito e la tabella si aggiorna.

Next Day:

1. Lo Scheduler preme `Next Day`.
2. Il frontend chiama `POST /api/state/next-day`.
3. Il backend incrementa `CurrentDay` di 1.
4. Le navi `Assigned` con occupazione completata diventano `Departed`.
5. Un toast conferma l'avanzamento; la pagina aggiorna giorno, storico e banchine.

### Flusso Calendario storico

Pagina condivisa e di sola lettura, raggiungibile da Operatore e Scheduler (e viceversa).

1. `calendar.html` carica `dates.js`, `api.js` e `calendar.js`.
2. La pagina chiama `GET /api/state`, `GET /api/berths` (solo per l'elenco statico
   nome/taglia banchine, non lo stato "oggi") e `GET /api/ships`. Nessun nuovo endpoint
   dedicato al calendario: e calcolato interamente lato client dai dati gia esposti.
3. Il calendario si apre di default sul **mese del giorno virtuale corrente dell'app**
   (convertito in data reale), non sul mese reale del computer: altrimenti il mese
   mostrato di default e quasi sempre vuoto, perche il tempo dell'app parte dal
   1 giugno 2026 e avanza solo con `Next Day`.
4. Ogni giorno mostra un badge `↓N` se ci sono N arrivi e uno `↑N` se ci sono N
   partenze, piu il conteggio "banchine occupate/totali" (vedi
   [spec 08](specs/08-storico-separato-login-unico.md); in origine, per la
   [spec 07](specs/07-ux-dashboard-storico.md), erano due semplici pallini senza
   conteggio). Calcolati per tutte le navi indipendentemente dallo stato (`Pending`,
   `Assigned`, `Departed`): lo storico resta visibile anche dopo che una nave e
   partita, e **non** e filtrato dai flag `hiddenFromSchedulerHistory` /
   `hiddenFromOperatorHistory`, perche il calendario resta la fonte di verita
   condivisa tra i due ruoli.
5. Cliccando un giorno si apre il dettaglio: arrivi, partenze e lo stato
   (Libera/Occupata) di **tutte** le banchine del terminal quel giorno, non solo quelle
   occupate.
6. Il link per tornare indietro (testo in sidebar e icona nell'header) punta solo alla
   pagina Operatore o Scheduler da cui si e aperto il calendario in quella sessione del
   browser (`sessionStorage`), non a entrambe.

## 6. API principali

| Metodo | Endpoint | Chiamato da | Scopo |
|---|---|---|---|
| `POST` | `/login` | `index.html` | Login demo e creazione cookie ruolo |
| `POST` | `/logout` | Operatore, Scheduler, Calendario | Cancella il cookie di ruolo |
| `GET` | `/api/state` | Operatore, Scheduler, Calendario | Legge giorno virtuale e data fittizia |
| `POST` | `/api/state/next-day` | Scheduler | Avanza il giorno virtuale |
| `POST` | `/api/arrivals` | Operatore | Genera anteprima dal faro |
| `GET` | `/api/ships` | Operatore, Scheduler, Calendario | Legge tutte le navi |
| `POST` | `/api/ships` | Operatore | Registra una nuova nave `Pending` |
| `PATCH` | `/api/ships/{id}` | Operatore | Corregge nome/note di una nave, solo se `Pending` |
| `GET` | `/api/ships/{id}/available-berths` | Scheduler | Banchine compatibili per taglia e loro disponibilita |
| `POST` | `/api/ships/{id}/assign` | Scheduler | Assegna una nave alla banchina scelta (nel corpo) |
| `DELETE` | `/api/ships/{id}` | Scheduler | Cancella una nave `Pending` dalla coda (rimozione reale) |
| `DELETE` | `/api/ships/{id}/scheduler-history` | Scheduler | Nasconde una nave solo dallo storico Scheduler |
| `DELETE` | `/api/ships/{id}/operator-history` | Operatore | Nasconde una nave solo dallo storico Operatore |
| `GET` | `/api/berths` | Operatore, Scheduler, Calendario | Legge stato banchine e prossime prenotazioni |

## 7. Regole di dominio principali

### Creazione nave

Il faro genera:

- dimensione casuale;
- arrivo entro 30 giorni dal giorno corrente;
- durata tra 3 e 15 giorni.

L'Operatore aggiunge:

- nome nave;
- note opzionali.

La nave nasce sempre in stato `Pending`.

### Assegnazione banchina

Lo Scheduler puo assegnare solo navi `Pending`, e ora **sceglie lui la banchina** tra
quelle compatibili (vedi [spec 07](specs/07-ux-dashboard-storico.md); in origine, per la
[spec 05](specs/05-banchine.md), la scelta era automatica).

Regole (invariate rispetto alla spec 05):

- la banchina deve avere la stessa dimensione della nave (validato server-side);
- la finestra di occupazione non deve sovrapporsi ad altre assegnazioni;
- se il periodo richiesto e occupato, il sistema cerca il primo slot libero sulla
  banchina scelta;
- dopo l'assegnazione, la nave passa a `Assigned`.

Le finestre temporali sono trattate cosi:

```text
[StartDay, StartDay + OccupationDays)
```

Quindi una nave che termina al giorno 10 libera la banchina per una nave che inizia al
giorno 10.

### Next Day

`Next Day`:

- avanza il giorno virtuale di 1;
- non crea navi;
- non assegna banchine;
- aggiorna a `Departed` le navi che hanno completato l'occupazione.

## 8. Decisioni progettuali e compromessi

### Frontend vanilla

Si usa HTML, CSS e JavaScript senza framework.

Motivo:

- riduce la complessita;
- rende chiaro il flusso `pagina -> API -> JSON`;
- e adatto a un progetto didattico focalizzato sull'architettura.

Compromesso:

- alcune funzioni JavaScript sono duplicate tra Operatore, Scheduler e Calendario, per
  esempio `escapeHtml` o il pattern del toggle "busy" sui bottoni;
- la conversione giorno virtuale -> data reale (`dates.js`), il tema (`theme.js`), la
  sidebar (`sidebar.js`), il logout (`logout.js`) e le notifiche (`toast.js`) sono stati
  invece estratti in script condivisi, perche usati identici su tutte le pagine
  autenticate.

### Service per la logica di dominio

Le regole stanno nei service e non nel controller.

Motivo:

- il controller resta leggibile;
- la logica e piu facile da spiegare e testare;
- rispetta la separazione `Controller -> Service -> DbContext`.

### Banchine fisse nel codice

Non esiste una tabella `Berths`.

Motivo:

- la commessa definisce un insieme fisso di banchine;
- non servono CRUD o configurazioni dinamiche;
- si evita complessita non richiesta.

Compromesso:

- se in futuro il numero di banchine cambiasse spesso, servirebbe spostarle nel database.

### Giorno virtuale invece di date reali

Il database salva `CurrentDay`, non una data reale.

Motivo:

- la commessa parla di giorno virtuale;
- evita due fonti di verita;
- semplifica il modello temporale.

La data mostrata in UI e solo una rappresentazione fittizia calcolata da una base fissa.

Dalla [spec 07](specs/07-ux-dashboard-storico.md) in poi, il frontend non mostra **mai**
il numero di giorno virtuale grezzo (niente piu "Giorno N" in nessuna pagina): solo la
data reale calcolata da `dates.js`. Il calendario storico usa la stessa conversione, e
si apre di default sul mese del giorno virtuale corrente, non su quello reale del
computer.

### Assegnazione banchina manuale invece che automatica

Dalla [spec 07](specs/07-ux-dashboard-storico.md), lo Scheduler sceglie a mano la
banchina tra quelle compatibili, invece che il sistema sceglierla in automatico
(comportamento originale della [spec 05](specs/05-banchine.md)).

Motivo:

- decisione esplicita del committente del progetto durante lo sviluppo;
- lo Scheduler resta comunque il responsabile della decisione operativa, coerente con
  "Fuori dallo scope" della commessa (nessuna pianificazione o ottimizzazione automatica).

Cosa non cambia:

- le regole di compatibilita e di non sovrapposizione restano identiche e sono validate
  server-side, non solo in UI;
- resta vietato modificare o riassegnare una nave dopo l'assegnazione (la modifica
  Operatore e permessa solo mentre la nave e `Pending`).

### Sidebar, tema e feedback visivi

Dalla [spec 07](specs/07-ux-dashboard-storico.md), le pagine autenticate condividono una
sidebar di navigazione a scomparsa, un tema chiaro/scuro persistito in `localStorage`, e
notifiche toast per ogni azione.

Motivo:

- migliorare l'usabilita durante i test manuali, senza introdurre framework o
  cambiare le regole di dominio;
- restare coerenti con l'approccio "vanilla" gia scelto per il frontend.

Compromesso:

- il markup della sidebar e duplicato su ogni pagina (`operator.html`, `scheduler.html`,
  `calendar.html`), come gia le altre pagine, perche non c'e un motore di template.

Dalla [spec 08](specs/08-storico-separato-login-unico.md), le icone dei bottoni
circolari sono SVG inline invece di glifi Unicode (che su Windows risultavano
decentrati nel cerchio a seconda del font di fallback), e il cambio tema applica una
transizione morbida temporanea invece di un cambio a scatto in un solo frame.

### Storico separato per pagina invece di un'unica cancellazione

Dalla [spec 08](specs/08-storico-separato-login-unico.md), cancellare una nave dallo
storico dell'Operatore o dello Scheduler nasconde la riga solo in quella pagina
(`HiddenFromSchedulerHistory` / `HiddenFromOperatorHistory`), invece di rimuoverla dal
database con `DELETE /api/ships/{id}`.

Motivo:

- segnalato come bug urgente durante i test manuali: cancellare una nave dallo storico
  di un ruolo la faceva sparire anche dal Calendario storico, condiviso tra i due
  ruoli, e dallo storico dell'altro ruolo;
- ogni pagina deve poter "pulire" la propria vista senza intaccare i dati che l'altro
  ruolo o il calendario stanno ancora consultando.

Compromesso:

- le righe nascoste restano comunque nel database (nessuna vera cancellazione dallo
  storico Operatore/Scheduler): accettabile perche la commessa non richiede una
  cancellazione definitiva dei dati storici, solo la corretta separazione delle viste;
- `DELETE /api/ships/{id}` (cancellazione reale) resta invariato, ma limitato alle navi
  ancora `Pending` nella coda dello Scheduler, prima che diventino un evento visibile a
  calendario.

### Login demo

Il progetto usa credenziali hardcoded e un cookie di ruolo.

Motivo:

- dimostra la separazione tra Operatore e Scheduler;
- evita ASP.NET Identity, utenti su database e gestione password;
- mantiene il focus sulla logica di BlueHarbor.

Compromesso:

- non e una soluzione di sicurezza per produzione.

### Nessuna ottimizzazione automatica

L'assegnazione trova il primo slot disponibile sulla banchina scelta dallo Scheduler, ma
non calcola il piano migliore e non sceglie la banchina al posto suo.

Motivo:

- la commessa esclude ottimizzazioni e KPI;
- lo Scheduler resta responsabile della decisione operativa;
- il progetto resta semplice e coerente.

## 9. Cosa resta fuori dallo scope

Il sistema non gestisce:

- eventi real-time;
- polling automatico;
- KPI;
- ottimizzazione delle banchine;
- normative o dati reali;
- riassegnazioni dopo l'assegnazione;
- utenti e permessi reali da database.

Queste esclusioni sono intenzionali e coerenti con la commessa.
