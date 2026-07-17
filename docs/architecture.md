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

Il frontend e composto da pagine statiche in `wwwroot`.

- `index.html`: scelta del ruolo.
- `login.html`: login demo.
- `operator.html`: pagina Operatore.
- `scheduler.html`: pagina Scheduler.
- `api.js`: punto unico per le chiamate HTTP.
- `app.js`: logica della pagina Operatore.
- `scheduler.js`: logica della pagina Scheduler.

Il frontend non contiene regole di dominio importanti: mostra dati, raccoglie input e
chiama le API.

### Backend

Il backend e una Web API ASP.NET Core.

- `Program.cs`: configurazione app, servizi, database, login demo e file statici.
- `BlueHarborController.cs`: espone gli endpoint HTTP usati dal frontend.
- `Services/`: contiene la logica di dominio.
- `Data/BlueHarborDbContext.cs`: accesso al database tramite EF Core.
- `Domain/`: contiene le entita principali del dominio.
- `Contracts/`: contiene le richieste e risposte usate dalle API.

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
- assegnare una nave `Pending` alla prima banchina compatibile disponibile;
- evitare sovrapposizioni tra finestre di occupazione;
- spostare la nave al primo slot libero se la finestra richiesta e occupata.

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

1. L'utente apre `index.html`.
2. Sceglie il ruolo: Operatore o Scheduler.
3. Viene portato a `login.html`.
4. Il form invia `POST /login`.
5. Il server controlla credenziali demo e crea un cookie di ruolo.
6. L'utente viene reindirizzato alla pagina corretta.

Credenziali demo:

| Ruolo | Utente | Password |
|---|---|---|
| Operatore | `operator` | `operator` |
| Scheduler | `admin` | `admin` |

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

1. L'Operatore preme `Nuovo arrivo dal faro`.
2. Il frontend chiama `POST /api/arrivals`.
3. Il faro genera dimensione, offset di arrivo e durata.
4. L'Operatore inserisce nome e note.
5. Il frontend chiama `POST /api/ships`.
6. Il backend crea la nave con stato `Pending`.
7. La pagina aggiorna elenco navi e banchine.

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
4. Lo storico mostra tutte le navi.

Assegnazione nave:

1. Lo Scheduler preme `Assegna` su una nave `Pending`.
2. Il frontend chiama `POST /api/ships/{id}/assign`.
3. Il backend cerca la prima banchina compatibile disponibile.
4. Se la finestra richiesta e libera, assegna la nave in quel periodo.
5. Se la finestra e occupata, cerca il primo slot libero successivo.
6. La nave passa a `Assigned`.
7. La pagina aggiorna navi e banchine.

Cancellazione nave:

1. Lo Scheduler preme `Cancella`.
2. Il frontend chiama `DELETE /api/ships/{id}`.
3. Il backend rimuove la nave.
4. Se era assegnata, la banchina risulta libera per quella finestra.

Next Day:

1. Lo Scheduler preme `Next Day`.
2. Il frontend chiama `POST /api/state/next-day`.
3. Il backend incrementa `CurrentDay` di 1.
4. Le navi `Assigned` con occupazione completata diventano `Departed`.
5. La pagina aggiorna giorno, storico e banchine.

## 6. API principali

| Metodo | Endpoint | Chiamato da | Scopo |
|---|---|---|---|
| `POST` | `/login` | `login.html` | Login demo e creazione cookie ruolo |
| `GET` | `/api/state` | Operatore, Scheduler | Legge giorno virtuale e data fittizia |
| `POST` | `/api/state/next-day` | Scheduler | Avanza il giorno virtuale |
| `POST` | `/api/arrivals` | Operatore | Genera anteprima dal faro |
| `GET` | `/api/ships` | Operatore, Scheduler | Legge tutte le navi |
| `POST` | `/api/ships` | Operatore | Registra una nuova nave `Pending` |
| `POST` | `/api/ships/{id}/assign` | Scheduler | Assegna una nave a una banchina |
| `DELETE` | `/api/ships/{id}` | Scheduler | Cancella una nave |
| `GET` | `/api/berths` | Operatore, Scheduler | Legge stato banchine e prossime prenotazioni |

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

Lo Scheduler puo assegnare solo navi `Pending`.

Regole:

- la banchina deve avere la stessa dimensione della nave;
- la finestra di occupazione non deve sovrapporsi ad altre assegnazioni;
- se il periodo richiesto e occupato, il sistema cerca il primo slot libero;
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

- alcune funzioni JavaScript sono duplicate tra Operatore e Scheduler, per esempio la
  formattazione delle date.

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

### Login demo

Il progetto usa credenziali hardcoded e un cookie di ruolo.

Motivo:

- dimostra la separazione tra Operatore e Scheduler;
- evita ASP.NET Identity, utenti su database e gestione password;
- mantiene il focus sulla logica di BlueHarbor.

Compromesso:

- non e una soluzione di sicurezza per produzione.

### Nessuna ottimizzazione automatica

L'assegnazione trova il primo slot disponibile, ma non calcola il piano migliore.

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
