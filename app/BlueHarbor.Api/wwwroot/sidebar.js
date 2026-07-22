// Gestisce la sidebar a scomparsa: il bottone fuori (nell'header) serve solo ad aprirla
// ed e visibile solo quando e chiusa; il bottone dentro la sidebar serve solo a richiuderla.
(function () {
  const STORAGE_KEY = "blueharbor-sidebar";
  const shell = document.querySelector(".app-shell");
  const openBtn = document.getElementById("btn-sidebar-toggle");
  const closeBtn = document.getElementById("btn-sidebar-close");

  if (!shell || !openBtn) return;

  function apply(collapsed) {
    if (collapsed) {
      shell.dataset.sidebar = "collapsed";
      openBtn.hidden = false;
    } else {
      delete shell.dataset.sidebar;
      openBtn.hidden = true;
    }
    localStorage.setItem(STORAGE_KEY, collapsed ? "collapsed" : "open");
  }

  apply(localStorage.getItem(STORAGE_KEY) === "collapsed");

  openBtn.addEventListener("click", () => apply(false));
  closeBtn?.addEventListener("click", () => apply(true));
})();
