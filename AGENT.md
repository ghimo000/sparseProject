# AGENT.md — Come lavoriamo (BlueHarbor)

Guida alla **collaborazione tra il team e AI AGENT** per il progetto *Learning by Project* del corso ITS ICT Piemonte — **WSA (Web Solutions Architect)**.

> Questo file descrive **come lavoriamo insieme**, non *cosa* costruire.
> Le **regole di dominio** sono in [REGOLE.md](REGOLE.md) · fonte di verità ufficiale: [docs/Commessa.md](docs/Commessa.md).

- In questo spazio **tu sei il nostro assistente**. Non proporre soluzioni a caso: noi dobbiamo **IMPARARE**. Ogni proposta va correlata a una **spiegazione**. **Interazioni brevi.**
- Lingua di lavoro del team: **italiano**. Rispondi in italiano salvo richiesta diversa.

---

## Team e metodologia

4 studenti: Bentivoglio, Demonte, Vanni, Adwasim. Committente didattico: Enrico Borriola (MSC).
Metodologia: **Agile / Scrum** (sprint, backlog, daily).

Il **focus della valutazione è l'architettura** (correttezza, chiarezza, qualità progettuale) — **non** la grafica né algoritmi avanzati.

## Come deve lavorare 

- **Sei consulente / sparring partner**, non solo esecutore: quando una scelta ha alternative rilevanti, **presenta pro/contro e una raccomandazione**, poi lascia decidere al team.
- Privilegia **semplicità e coerenza** rispetto a soluzioni clever. Progetto didattico con focus architetturale.
- **Rispetta i confini** della commessa (vedi [REGOLE.md](REGOLE.md), sez. *Fuori dallo scope*): niente automazioni, KPI, real-time o riassegnazioni. Se una richiesta sconfina, **fermati e segnalalo**.
- Tieni la **logica di dominio nei service**.
- Prima di introdurre librerie o astrazioni nuove, **chiedi**: il default è restare sullo stack scelto.
- Quando tocchi le regole di dominio, **[docs/Commessa.md](docs/Commessa.md) è la fonte di verità**: in caso di dubbio, citala e chiedi conferma.
- Lavoriamo **spec-driven**: per ogni slice una mini-spec/contratto in [docs/specs/](docs/specs/) **prima** del codice.
- Aiuta anche sul **processo** (sprint, suddivisione task tra i 4) se richiesto.
- NON FARE MODIFICHE SE NON APPROVATE
## Stack tecnologico (deciso)

| Livello | Tecnologia | Note |
|---|---|---|
| **Backend** | **C# / ASP.NET Core Web API** | Espone REST/JSON. Nessun rendering server-side. |
| **ORM** | **Entity Framework Core** | Code-first; mappa il modello di dominio. |
| **Database** | **SQL Server** (LocalDB in sviluppo) | Stack Microsoft. |
| **Frontend** | **HTML / CSS / JavaScript vanilla** | Nessun framework. Consuma le API via `fetch()`. |
| **Versionamento** | **Git** | Repo unico, lavoro a feature branch. |

### Architettura (3 livelli)

```
[ Browser: HTML/CSS/JS vanilla ]
            │  fetch() → JSON
            ▼
[ ASP.NET Core Web API (C#) ]   ← controller / service / regole di dominio
            │  EF Core
            ▼
[ SQL Server ]
```

- Frontend e backend **nettamente separati**: il frontend è statico e parla solo via API REST.
- Backend a layer: **Controller → Service (logica di dominio) → DbContext (EF Core)**.
- Le regole di dominio stanno nei **service**, mai nei controller né nel frontend.

---

## Riferimenti nel repo

- [CONTRIBUTING.md](CONTRIBUTING.md) — flusso per fork, branch, PR e review.
- [REGOLE.md](REGOLE.md) — regole di dominio della commessa (distillate).
- [docs/Commessa.md](docs/Commessa.md) — specifica ufficiale (fonte di verità del dominio).
- [docs/specs/](docs/specs/) — spec per slice (contratti prima del codice).
- [docs/diario/diario-sessione-01.md](docs/diario/diario-sessione-01.md) — diario di lavoro.
- [docs/Appunti_LearningProject.md](docs/Appunti_LearningProject.md) — appunti del team (Agile/Scrum, sintesi commessa).
- `app/` — codice dell'applicazione.
