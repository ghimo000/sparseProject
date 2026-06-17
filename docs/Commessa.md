LEARNING BY PROJECT – REGISTRO OPERATIVO TERMINAL BLUEHARBOR

Scenario di business


Una compagnia di spedizioni fittizia gestisce un piccolo terminal container chiamato
BlueHarbor.
Le operazioni quotidiane sono attualmente coordinate manualmente, causando inefficienze
e scarsa visibilità operativa.

BlueHarbor necessita di una semplice piattaforma web interna che consenta di:
• registrare le navi in arrivo
• pianificare l’uso delle banchine
• coordinare il lavoro tra il personale operativo

Tutti i dati, i nomi e le regole sono fittizi e creati esclusivamente per finalità didattiche.

---Ruoli
L’applicazione supporta due ruoli operativi:

Operatore:
• Registra nuove navi nel sistema
• Mantiene le informazioni e lo stato delle navi
• Non gestisce l’assegnazione delle banchine

Scheduler:
• Visualizza le navi in attesa di assegnazione
• Assegna le navi alle banchine disponibili secondo regole definite
• Gestisce le decisioni di pianificazione
Ogni utente è associato a un solo ruolo.


---Modello temporale
Il sistema non è real-time.
• L’applicazione mantiene un giorno corrente virtuale
• Un’azione “Next Day” consente di avanzare il tempo di un giorno alla volta
• Non vengono gestite ore o minuti
Questo modello temporale semplificato è parte integrante dell’esercizio.

---Regole di dominio
Dimensione delle navi
Le navi possono avere una delle seguenti dimensioni:
XL, L, M, S
Banchine
BlueHarbor dispone di un insieme fisso di banchine:
• 1 banchina XL
• 1 banchina L
• 2 banchine M
• 4 banchine S
Una banchina può ospitare solo navi della propria dimensione.


---Creazione delle navi
Quando l’Operatore crea una nuova nave:
Il sistema assegna automaticamente:
• una dimensione casuale
• un giorno di arrivo casuale (non oltre 30 giorni dal giorno corrente)
• una durata di occupazione della banchina casuale (compresa tra 3 e 15 giorni)
L’Operatore inserisce i restanti metadati (es. nome della nave, note)
La nave viene creata con stato “Pending"


---Ciclo di vita delle navi
Le navi seguono un ciclo di vita minimale:
• Pending – in attesa di assegnazione
• Assigned – banchina assegnata
• Departed – occupazione terminata
Una nave in stato Departed è considerata conclusa ai fini dell’esercizio.
Flusso operativo dello Scheduler
Lo Scheduler:
• Visualizza tutte le navi in stato Pending
• Per ciascuna nave visualizza dimensione, giorno di arrivo e durata di occupazione
• Assegna la nave a una banchina rispettando le seguenti regole:
o la banchina deve essere compatibile per dimensione
o il giorno di inizio deve essere il primo giorno libero della banchina
o la banchina rimane occupata per l’intera finestra di occupazione
Sensitivity: Public
Se una banchina è occupata, la nave viene pianificata nel primo slot temporale disponibile
per quella banchina.
Al momento dell’assegnazione:
• l’assegnazione viene salvata
• lo stato della nave passa a Assigned
Lo Scheduler deve poter identificare facilmente le banchine occupate o libere e le navi
assegnabili.
Azione Next Day
L’azione Next Day:
• Avanza il giorno virtuale di una unità
• Aggiorna l’elenco delle navi
• Non effettua assegnazioni automatiche
• Imposta automaticamente lo stato Departed per le navi che hanno completato il
periodo di occupazione
Fuori dallo scope
Il sistema non deve:
• effettuare pianificazioni automatiche o ottimizzazioni
• calcolare punteggi o KPI
• gestire eventi real-time
• modellare terminal reali o normative
• consentire modifiche o riassegnazioni dopo l’assegnazione
Deliverable attesi
Ogni gruppo deve consegnare:
1. Una applicazione web funzionante che implementi il comportamento descritto
2. Una breve presentazione o documento architetturale che descriva:
• architettura complessiva
• componenti principali e responsabilità
• modello dati ad alto livello
• principali decisioni progettuali e compromessi
L’attenzione è posta sulla correttezza, chiarezza e qualità architetturale, non su algoritmi
avanzati o sulla cura grafica.
Note finali
• L’organizzazione interna del team è a carico degli studenti
• Le assunzioni sono ammesse se opportunamente giustificate
Sensitivity: Public
• Semplicità e coerenza sono preferibili alla complessità