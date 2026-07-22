// Tasto di assistenza presente su tutte le pagine: apre un piccolo modulo per segnalare un
// problema di funzionamento dell'applicazione. Le opzioni proposte cambiano tra la pagina di
// login (problemi di accesso) e le pagine autenticate (problemi con le funzioni dell'app).
// Non serve inserire un'email: l'app e uso interno di un'unica azienda.
(function () {
  const isLoginPage = !!document.querySelector(".login-panel");

  const LOGIN_CATEGORIES = [
    "Non riesco ad accedere con le mie credenziali",
    "La pagina di accesso non si carica correttamente",
    "Il cambio tema chiaro/scuro non funziona",
    "Altro problema di accesso",
  ];

  const APP_CATEGORIES = [
    "Una pagina non si carica o resta bloccata",
    "Un dato mostrato non e corretto o non si aggiorna",
    "Un pulsante o un'azione non risponde come previsto",
    "Errore durante il salvataggio di una modifica",
    "Altro problema di funzionamento",
  ];

  const categories = isLoginPage ? LOGIN_CATEGORIES : APP_CATEGORIES;
  const sidebarFooter = document.querySelector(".sidebar-footer");

  const button = document.createElement("button");
  button.id = "btn-support";
  button.type = "button";
  // Nella shell con sidebar il tasto sta nel footer, come il toggle tema: nessun elemento
  // fisso serve li'. Solo sul login (senza sidebar) resta flottante, sopra al toggle tema.
  button.className = sidebarFooter ? "icon-button theme-toggle" : "icon-button support-button-floating";
  button.title = "Richiedi assistenza";
  button.setAttribute("aria-label", "Richiedi assistenza");
  button.innerHTML =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9.5"></circle>' +
    '<path d="M9.3 9.3a2.7 2.7 0 1 1 3.9 2.4c-.9.5-1.2 1-1.2 1.9"></path>' +
    '<circle cx="12" cy="17" r=".25" fill="currentColor" stroke="none"></circle>' +
    "</svg>";

  const optionsHtml = categories
    .map((label) => `<option value="${label}">${label}</option>`)
    .join("");

  const overlay = document.createElement("div");
  overlay.id = "support-dialog";
  overlay.className = "dialog-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="dialog-panel support-dialog-panel" role="dialog" aria-labelledby="support-dialog-title">
      <h3 id="support-dialog-title">Richiedi assistenza</h3>
      <p>Segnala un problema di funzionamento dell'applicazione.</p>
      <form id="form-support">
        <label>Tipo di problema
          <select id="support-category" required>${optionsHtml}</select>
        </label>
        <label>Descrivi meglio il problema (facoltativo)
          <textarea id="support-description" maxlength="500" rows="3" placeholder="Aggiungi eventuali dettagli utili..."></textarea>
        </label>
        <div class="dialog-actions">
          <button id="btn-support-cancel" class="secondary" type="button">Annulla</button>
          <button type="submit">Invia segnalazione</button>
        </div>
      </form>
    </div>
  `;

  if (sidebarFooter) {
    const themeButton = sidebarFooter.querySelector("#btn-theme");
    if (themeButton) {
      themeButton.after(button);
    } else {
      sidebarFooter.prepend(button);
    }
  } else {
    document.body.append(button);
  }

  document.body.append(overlay);

  const form = overlay.querySelector("#form-support");
  const categorySelect = overlay.querySelector("#support-category");
  const descriptionField = overlay.querySelector("#support-description");
  const cancelButton = overlay.querySelector("#btn-support-cancel");

  function openDialog() {
    form.reset();
    overlay.hidden = false;
    categorySelect.focus();
  }

  function closeDialog() {
    overlay.hidden = true;
  }

  button.addEventListener("click", openDialog);
  cancelButton.addEventListener("click", closeDialog);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeDialog();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    closeDialog();
    window.Toast?.success("Richiesta inviata: il supporto tecnico la esaminera' a breve.");
  });
})();
