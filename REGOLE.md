# REGOLE.md — Regole della commessa (BlueHarbor)

Le **regole di dominio** del progetto *Learning by Project — BlueHarbor*: cosa il sistema deve fare.
Fonte di verità ufficiale: [docs/Commessa.md](docs/Commessa.md). In caso di dubbio o conflitto, **vince `Commessa.md`**.

> ⚠️ Dati, nomi e regole sono **fittizi**, a scopo esclusivamente didattico.

---

## 1. Scenario

**BlueHarbor** è una compagnia di spedizioni fittizia che gestisce un piccolo terminal container.
Serve una **piattaforma web interna** per:

- registrare le navi in arrivo;
- pianificare l'uso delle banchine;
- coordinare il lavoro tra il personale operativo.

Principio guida della commessa: **semplicità e coerenza prima della complessità**.

## 2. Ruoli applicativi

Ogni utente ha **un solo ruolo**. Login richiesto.

- **Operatore**
  - registra nuove navi;
  - mantiene informazioni e stato delle navi;
  - **non** gestisce l'assegnazione delle banchine.
- **Scheduler**
  - visualizza le navi in attesa (`Pending`);
  - assegna le navi alle banchine secondo le regole;
  - gestisce le decisioni di pianificazione.

## 3. Regole di dominio

### Modello temporale
- **Non real-time.** Esiste un **giorno corrente virtuale**.
- Azione **Next Day**: avanza il tempo di **un giorno** alla volta. Niente ore/minuti.

### Dimensioni navi e banchine
- Navi: dimensione **XL, L, M, S**.
- Banchine (insieme **fisso**): **1× XL, 1× L, 2× M, 4× S**.
- Una banchina ospita **solo** navi della propria dimensione.

### Creazione nave (Operatore)
Il sistema assegna **automaticamente e in modo casuale**:
- dimensione casuale;
- giorno di arrivo casuale (**≤ 30 giorni** dal giorno corrente);
- durata di occupazione casuale (**tra 3 e 15 giorni**).

L'Operatore inserisce i metadati restanti (nome nave, note). Stato iniziale: **`Pending`**.

### Ciclo di vita nave
`Pending` → `Assigned` → `Departed` (conclusa).

### Flusso Scheduler — assegnazione
- Vede tutte le navi `Pending` con dimensione, giorno d'arrivo e durata.
- Assegna rispettando **tutte** le regole:
  - banchina **compatibile per dimensione**;
  - il giorno di inizio è il **primo giorno libero** di quella banchina;
  - la banchina resta occupata per **l'intera finestra** di occupazione.
- Se la banchina è occupata, la nave va nel **primo slot temporale disponibile**.
- All'assegnazione: si salva l'assegnazione e lo stato passa a **`Assigned`**.
- Lo Scheduler deve distinguere facilmente banchine **occupate/libere** e navi **assegnabili**.

### Azione Next Day
- Avanza il giorno virtuale di **1**.
- Aggiorna l'elenco navi.
- **Non** effettua assegnazioni automatiche.
- Imposta automaticamente **`Departed`** alle navi che hanno completato l'occupazione.

## 4. Fuori dallo scope (NON implementare)

Il sistema **non** deve:

- effettuare pianificazioni **automatiche** o ottimizzazioni;
- calcolare punteggi o **KPI**;
- gestire eventi **real-time**;
- modellare terminal reali o normative;
- consentire **modifiche o riassegnazioni dopo l'assegnazione**.

> Se una richiesta sconfina qui, **fermarsi e segnalarlo** invece di implementarla.
> Le assunzioni sono ammesse **solo se giustificate**.

## 5. Deliverable attesi

1. **Applicazione web funzionante** che implementi il comportamento sopra.
2. **Relazione tecnica / presentazione architetturale**:
   - architettura complessiva;
   - componenti principali e responsabilità;
   - modello dati ad alto livello;
   - principali decisioni progettuali e compromessi.
