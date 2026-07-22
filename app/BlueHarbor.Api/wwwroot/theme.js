// Applica subito il tema salvato (va incluso in <head>, prima del CSS, per evitare il flash).
(function () {
  const STORAGE_KEY = "blueharbor-theme";
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved ?? (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);

  // Espone le funzioni usate dal toggle nella sidebar, una volta caricata la pagina.
  window.Theme = {
    // Icone SVG condivise dal bottone tema: sostituiscono i glifi Unicode (che su Windows
    // cadono su font/emoji diversi e finiscono decentrati dentro il bottone circolare).
    icons: {
      sun: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="2" x2="12" y2="4.5"></line><line x1="12" y1="19.5" x2="12" y2="22"></line><line x1="4.5" y1="12" x2="2" y2="12"></line><line x1="22" y1="12" x2="19.5" y2="12"></line><line x1="5.1" y1="5.1" x2="6.8" y2="6.8"></line><line x1="17.2" y1="17.2" x2="18.9" y2="18.9"></line><line x1="18.9" y1="5.1" x2="17.2" y2="6.8"></line><line x1="6.8" y1="17.2" x2="5.1" y2="18.9"></line></svg>',
      moon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M20.742 13.045A8.088 8.088 0 0 1 18.412 13c-4.156 0-7.527-3.377-7.527-7.542 0-.83.135-1.628.384-2.373a.75.75 0 0 0-.98-.941A9.79 9.79 0 0 0 4 8.21C4 13.617 8.375 18 13.773 18a9.807 9.807 0 0 0 7.918-4.02.75.75 0 0 0-.949-.935Z"></path></svg>',
    },
    get() {
      return document.documentElement.getAttribute("data-theme") ?? "light";
    },
    set(value) {
      document.documentElement.setAttribute("data-theme", value);
      localStorage.setItem(STORAGE_KEY, value);
    },
    // Applica una transizione morbida solo durante il cambio, cosi lo switch chiaro/scuro
    // dissolve i colori invece di dare un flash netto; la classe si toglie subito dopo.
    toggle() {
      const root = document.documentElement;
      root.classList.add("theme-transition");
      this.set(this.get() === "dark" ? "light" : "dark");
      window.setTimeout(() => root.classList.remove("theme-transition"), 250);
    },
  };
})();
