// Scorciatoia per recuperare un elemento HTML tramite id.
const $ = (id) => document.getElementById(id);

const params = new URLSearchParams(window.location.search);
const requestedReturnUrl = params.get("returnUrl");

$("login-error").hidden = !params.has("error");

// Un unico tasto di accesso: il server deduce il ruolo dalle credenziali. Se si arriva qui
// perche non autenticati per una pagina specifica, la si porta con se per tornarci dopo il login.
if (requestedReturnUrl) {
  $("return-url").value = requestedReturnUrl;
}

// Toggle del tema chiaro/scuro, come nelle pagine autenticate ma senza sidebar.
function syncThemeIcon() {
  $("btn-theme").innerHTML = Theme.get() === "dark" ? Theme.icons.sun : Theme.icons.moon;
}

$("btn-theme").addEventListener("click", () => {
  Theme.toggle();
  syncThemeIcon();
});

syncThemeIcon();
