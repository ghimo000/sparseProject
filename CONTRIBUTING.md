# Contributing

Il repository ufficiale viene aggiornato solo tramite Pull Request.

Repository ufficiale:

```text
https://github.com/ghimo000/sparseProject
```

Il branch principale del progetto e `master`.

Per le istruzioni operative degli agenti AI, leggi anche [AGENT.md](AGENT.md).

---

## Flusso breve

1. Scegli una issue.
2. Commenta nella issue: `La prendo io`.
3. Fai il fork del repository, se non lo hai gia fatto.
4. Clona il tuo fork in locale.
5. Collega il repository ufficiale come `upstream`.
6. Aggiorna il tuo `master`.
7. Crea un branch dedicato.
8. Fai le modifiche richieste dalla issue.
9. Esegui i controlli disponibili.
10. Controlla bene i file modificati.
11. Fai commit.
12. Pusha il branch sul tuo fork.
13. Apri una Pull Request verso il repository ufficiale.
14. Attendi review.
15. Il merge viene fatto dal maintainer.

Non lavorare direttamente su `master`.

---

## 0. GitHub CLI

Usiamo `gh` per lavorare con issue e Pull Request da terminale.

Controlla se sei autenticato:

```bash
gh auth status
```

Se non sei autenticato, oppure il token non funziona:

```bash
gh auth login -h github.com
```

Comandi utili:

```bash
gh issue list
gh issue view 12
gh issue comment 12 --body "La prendo io"
gh pr create
```

Sostituisci `12` con il numero reale della issue.

---

## 1. Fork

Fai il fork con GitHub CLI:

```bash
gh repo fork ghimo000/sparseProject --clone=false
```

Il fork si fa una sola volta, non per ogni issue.

In alternativa, dal sito GitHub:

1. Apri `https://github.com/ghimo000/sparseProject`.
2. Clicca `Fork`.
3. Crea il fork nel tuo account.

---

## 2. Clone del fork

```bash
git clone https://github.com/TUO-USERNAME/sparseProject.git
cd sparseProject
```

`TUO-USERNAME` e il tuo username GitHub.

---

## 3. Collegare il repository ufficiale

```bash
git remote add upstream https://github.com/ghimo000/sparseProject.git
```

Controlla i remote:

```bash
git remote -v
```

Per chi lavora dal fork:

- `origin` deve essere il tuo fork;
- `upstream` deve essere il repository ufficiale.

---

## 4. Aggiornare `master`

Prima di iniziare una nuova issue:

```bash
git checkout master
git pull upstream master
git push origin master
```

---

## 5. Creare un branch per la issue

```bash
git checkout -b issue-12-breve-descrizione
```

Usa un branch diverso per ogni issue.

Esempi:

```bash
git checkout -b issue-12-doc-flusso
git checkout -b issue-15-doc-next-day
```

---

## 6. Fare le modifiche

Lavora solo sui file necessari per la issue.

Controlla spesso cosa hai modificato:

```bash
git status
```

Per vedere il dettaglio:

```bash
git diff
```

---

## 7. Eseguire i controlli

Allo stato attuale il controllo richiesto e la build .NET:

```bash
dotnet build app/BlueHarbor.Api/BlueHarbor.Api.csproj
```

Questo compila anche `BlueHarbor.Faro`.

Se la build fallisce, correggi prima di aprire la Pull Request.

Al momento non ci sono test automatici configurati.

Nella PR scrivi:

```md
## Tests
- dotnet build app/BlueHarbor.Api/BlueHarbor.Api.csproj
```

---

## 8. Preparare il commit

Prima di fare commit:

```bash
git status
```

Evita di committare file non collegati alla issue.

Preferisci aggiungere file espliciti:

```bash
git add percorso/file1.md percorso/file2.cs
```

Usa `git add .` solo se hai controllato bene l'elenco dei file modificati.

Attenzione: non committare file temporanei o output di build, in particolare:

```text
.tmp/
.tmp/build-check/
bin/
obj/
```

Anche se `.tmp/` e in `.gitignore`, alcuni file temporanei potrebbero risultare gia tracciati da git. Se li vedi in `git status`, non aggiungerli alla PR.

---

## 9. Commit

```bash
git commit -m "Fix issue #12"
```

Sostituisci `12` con il numero della issue.

Per una modifica di documentazione:

```bash
git commit -m "Docs issue #12"
```

---

## 10. Push sul fork

```bash
git push origin issue-12-breve-descrizione
```

---

## 11. Pull Request

Apri una Pull Request con GitHub CLI:

```bash
gh pr create
```

La PR deve essere:

```text
base: repository ufficiale / master
compare: tuo fork / tuo branch
```

Nella descrizione inserisci:

```md
Closes #12
```

Cosi la issue viene chiusa automaticamente dopo il merge.

---

## 12. Review

Se vengono richieste modifiche:

```bash
git add percorso/file-modificato
git commit -m "Address review feedback"
git push origin issue-12-breve-descrizione
```

La PR si aggiorna da sola.

---

## Regole semplici

- Una issue = una PR.
- Un branch per ogni issue.
- Non lavorare su `master`.
- Non mischiare modifiche non collegate.
- Non fare refactor non richiesti.
- Non committare segreti, token o file `.env`.
- Non committare output di build o file temporanei.
- Prima della PR, verifica che il progetto funzioni.

---

## Per agenti AI

Prima di lavorare, leggi anche [AGENT.md](AGENT.md).

Quando lavori su una issue:

1. Leggi la issue.
2. Leggi il contesto del repository.
3. Modifica solo i file necessari.
4. Non fare refactor non richiesti.
5. Esegui i controlli disponibili.
6. Apri una PR piccola e chiara.
7. Collega la PR con `Closes #numero`.

Formato PR consigliato:

```md
## Summary
- Cosa e stato modificato

## Tests
- dotnet build app/BlueHarbor.Api/BlueHarbor.Api.csproj

Closes #12
```
