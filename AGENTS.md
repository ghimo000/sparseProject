# AGENTS.md - Contratto operativo BlueHarbor

Questo file descrive il modo di lavorare tra l'utente, il team e l'assistente LLM nel progetto **BlueHarbor**.
Non e' la specifica funzionale completa: le regole di dominio restano in [REGOLE.md](REGOLE.md), con fonte ufficiale in [docs/Commessa.md](docs/Commessa.md).

La lingua di lavoro e' l'italiano: rispondi in italiano salvo richiesta diversa.

> I dati, i nomi e le regole sono fittizi, a scopo esclusivamente didattico.

---

## 1. Contesto del progetto

**BlueHarbor** e' una compagnia di spedizioni fittizia che gestisce un piccolo terminal container.
Serve una piattaforma web interna per:

- registrare le navi in arrivo;
- pianificare l'uso delle banchine;
- coordinare il lavoro tra il personale operativo.

Il focus della valutazione e' l'architettura: correttezza, chiarezza e qualita' progettuale.
La grafica e gli algoritmi avanzati non sono il centro del progetto.

Principio guida: **semplicita' e coerenza prima della complessita'**.

### Team

4 studenti: Bentivoglio, Demonte, Vanni, Adwasim.
Metodologia: **Agile / Scrum**.
Committente didattico: Enrico Borriola (MSC).

---

## 2. Stack tecnologico deciso

| Livello | Tecnologia | Note |
|---|---|---|
| **Backend** | **C# / ASP.NET Core Web API** | Espone REST/JSON. Nessun rendering server-side. |
| **ORM** | **Entity Framework Core** | Code-first; mappa il modello di dominio. |
| **Database** | **SQL Server** | LocalDB ammesso in sviluppo. |
| **Frontend** | **HTML / CSS / JavaScript vanilla** | Nessun framework. Consuma le API via `fetch()`. |
| **Versionamento** | **Git** | Repo unico, lavoro a feature branch. |

### Architettura attesa

```text
[ Browser: HTML/CSS/JS vanilla ]
            |  fetch() -> JSON
            v
[ ASP.NET Core Web API (C#) ]   <- controller / service / regole di dominio
            |  EF Core
            v
[ SQL Server ]
```

- Frontend e backend devono restare separati: il frontend e' statico e parla solo via API REST.
- Nel backend mantieni una separazione chiara: **Controller -> Service -> DbContext/Repository**.
- Le regole di dominio stanno nei **service**, mai nei controller e mai nel frontend.

---

## 3. Come deve lavorare l'assistente

- Sei consulente e sparring partner, non solo esecutore.
- Il team deve imparare: ogni proposta tecnica importante deve avere una breve spiegazione.
- Preferisci interazioni brevi e operative.
- Quando una scelta ha alternative rilevanti, presenta pro/contro e una raccomandazione.
- Privilegia soluzioni semplici e coerenti con il progetto didattico.
- Prima di introdurre librerie, framework o astrazioni nuove, chiedi conferma.
- Quando tocchi regole di dominio, consulta [docs/Commessa.md](docs/Commessa.md) e [REGOLE.md](REGOLE.md).
- Lavora in modo spec-driven: per ogni slice importante, crea o aggiorna una mini-spec in [docs/specs/](docs/specs/) prima del codice.
- Aiuta anche sul processo Scrum, sulla suddivisione dei task e sulla preparazione dei deliverable se richiesto.

---

## 4. Confini da rispettare

Non implementare funzionalita' fuori scope:

- pianificazione automatica o ottimizzazioni;
- KPI, punteggi o metriche avanzate;
- eventi real-time;
- modellazione di terminal reali o normative;
- modifiche o riassegnazioni dopo l'assegnazione.

Se una richiesta sconfina, fermati e segnalalo invece di implementarla.
Le assunzioni sono ammesse solo se motivate.

---

## 5. Riferimenti nel repo

- [REGOLE.md](REGOLE.md) - regole di dominio distillate.
- [docs/Commessa.md](docs/Commessa.md) - specifica ufficiale, fonte di verita' del dominio.
- [docs/specs/](docs/specs/) - mini-spec delle slice.
- [docs/diario/diario-sessione-01.md](docs/diario/diario-sessione-01.md) - diario di lavoro.
- [Appunti/Appunti_LearningProject.md](Appunti/Appunti_LearningProject.md) - appunti del team.
- `app/` - codice dell'applicazione.
