# Checklist E2E — BlueHarbor

Obiettivo della prossima sessione: verificare end-to-end le funzionalità già
implementate prima di iniziare nuove slice.

## Prerequisiti

- Decidere la persistenza da usare in sviluppo.
- Avviare SQL Server o l'alternativa scelta.
- Applicare le migration EF Core.
- Avviare l'app ASP.NET Core.
- Aprire la UI dall'URL servito da ASP.NET Core, non da Live Server.

Comandi attesi, da adattare alla persistenza scelta:

```bash
dotnet ef database update -p app/BlueHarbor.Api -s app/BlueHarbor.Api
dotnet run --project app/BlueHarbor.Api
```

## Test dalla UI

1. Aprire la home servita dal backend.
2. Verificare che compaiano `Data corrente` e `Giorno virtuale`.
3. Cliccare **Nuovo arrivo dal faro**.
4. Verificare che taglia, offset arrivo e durata siano mostrati in sola lettura.
5. Inserire nome nave e note.
6. Confermare la creazione.
7. Verificare che la nave compaia nell'elenco con stato `Pending`.
8. Cliccare **Next Day**.
9. Verificare che la data corrente avanzi di un giorno.
10. Verificare che il giorno virtuale aumenti di 1.
11. Ricaricare la pagina.
12. Verificare che nave e giorno corrente siano ancora presenti.

## Test API utili

```bash
curl http://localhost:<porta>/api/state
curl -X POST http://localhost:<porta>/api/arrivals
curl http://localhost:<porta>/api/ships
curl -X POST http://localhost:<porta>/api/state/next-day
```

Per `POST /api/ships`, usare un body JSON coerente con i dati ricevuti dal faro.

## Cosa non testare ancora

- Login e ruoli.
- Banchine.
- Assegnazione Scheduler.
- Passaggio a `Departed`.
- Ottimizzazioni o pianificazione automatica.
