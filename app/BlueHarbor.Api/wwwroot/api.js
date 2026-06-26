// Unico punto in cui vivono gli endpoint dell'API.
// Il resto del frontend NON hardcoda mai un URL: chiama queste funzioni.
// Gli URL sono relativi: la pagina è servita dalla stessa API (stessa origine).

const API = {
  async getState() {
    const res = await fetch("/api/state");
    if (!res.ok) throw new Error("Impossibile leggere lo stato.");
    return res.json();
  },

  async nextDay() {
    const res = await fetch("/api/state/next-day", { method: "POST" });
    if (!res.ok) throw new Error("Impossibile avanzare il giorno.");
    return res.json();
  },

  async generateArrival() {
    const res = await fetch("/api/arrivals", { method: "POST" });
    if (!res.ok) throw new Error("Il faro non ha risposto.");
    return res.json();
  },

  async getShips() {
    const res = await fetch("/api/ships");
    if (!res.ok) throw new Error("Impossibile leggere le navi.");
    return res.json();
  },

  async createShip(payload) {
    const res = await fetch("/api/ships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const problem = await res.json().catch(() => null);
      throw new Error(problem?.title ?? "Creazione nave fallita.");
    }
    return res.json();
  },
};
