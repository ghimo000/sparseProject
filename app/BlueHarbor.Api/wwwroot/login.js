const params = new URLSearchParams(window.location.search);
const returnUrl = params.get("returnUrl") || "/";

document.getElementById("return-url").value = returnUrl;
document.getElementById("login-error").hidden = !params.has("error");

const title = document.getElementById("login-title");

if (returnUrl.includes("operator.html")) {
  title.textContent = "Accesso Operatore";
} else if (returnUrl.includes("scheduler.html")) {
  title.textContent = "Accesso Scheduler";
}
