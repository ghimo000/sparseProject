// Mostra un banner di conferma prima di eseguire davvero il logout.
(function () {
  const openBtn = document.getElementById("btn-logout");
  const dialog = document.getElementById("logout-dialog");
  const cancelBtn = document.getElementById("btn-logout-cancel");

  if (!openBtn || !dialog) return;

  function open() {
    dialog.hidden = false;
  }

  function close() {
    dialog.hidden = true;
  }

  openBtn.addEventListener("click", open);
  cancelBtn?.addEventListener("click", close);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dialog.hidden) close();
  });
})();
