Suggerimenti raccolti durante i test manuali. Dettagli e verifica in
[spec 08](specs/08-storico-separato-login-unico.md).

- [x] Rifinire il calendario rendendolo piu grafico/immediato con lo stato di ogni
      banchina per ogni giorno selezionato — dettaglio giorno ora mostra tutte le
      banchine (Libera/Occupata); griglia mensile mostra badge arrivi/partenze e
      conteggio banchine occupate al posto dei pallini.

- [x] Sistemare i pulsanti che hanno le icone decentrate — sostituiti i glifi Unicode
      con SVG inline centrati.

- [x] Rifinire il comando chiaro/scuro che crea sflasha dal passagio da chiaro a
      scuro — aggiunta una transizione morbida temporanea durante il cambio tema.

- [x] URGENTE: Separare lo storico dello scheduler dallo storico del calendario
      (quando si cancella nello storico dello scheduler non deve cancellarle nel
      calendario) — nuovo flag `HiddenFromSchedulerHistory` e nascondimento locale,
      il calendario non e piu toccato.

- [x] Aggiungere il tasto cancella allo stroico dell'operator (sempre senza intaccare
      il calendario) — nuovo flag `HiddenFromOperatorHistory`, stesso meccanismo.

- [ ] Scegliere un logo coerente con l'applicazione web — a carico del committente,
      non incluso in questo giro.

- [x] Unico tasto login, in base alle credenziali immesse effettua il login nella
      sezione annessa — un solo bottone "Accedi", il ruolo si deduce dalle
      credenziali lato server.
