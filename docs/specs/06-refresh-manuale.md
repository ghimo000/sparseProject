# Spec 06 - Refresh manuale pagine

> Stato: **implementata** - Slice: usabilita durante i test - Fonte di verita del dominio: [Commessa.md](../Commessa.md)

## Obiettivo

Permettere a Operatore e Scheduler di aggiornare i dati della pagina senza ricaricare
il browser e senza rifare il login.

BlueHarbor non e real-time: le pagine leggono i dati solo quando chiamano le API.
Con due pagine aperte, una modifica fatta dall'Operatore non compare nello Scheduler
finche lo Scheduler non rilegge i dati.

## Scelta

Aggiungiamo un bottone manuale:

```text
Aggiorna
```

Il bottone ricarica i dati visibili della pagina corrente usando le API gia esistenti.
Non introduce polling, websocket o aggiornamenti automatici.

## Pagina Operatore

Il bottone aggiorna:

- giorno/data corrente;
- navi registrate;
- stato banchine in sola lettura.

## Pagina Scheduler

Il bottone aggiorna:

- giorno/data corrente;
- navi `Pending`;
- storico navi;
- stato banchine.

## Cosa non facciamo

- niente refresh automatico periodico;
- niente real-time;
- niente nuove API;
- niente cambio alle regole di dominio.

## Verifica attesa

1. Aprire Operatore e Scheduler in due tab.
2. Creare una nave da Operatore.
3. Senza ricaricare Scheduler, premere `Aggiorna`.
4. La nave compare nello Scheduler.
5. Il browser non richiede nuovamente la password.
