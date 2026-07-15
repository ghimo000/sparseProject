// Unico punto in cui vivono gli endpoint dell'API.
const API = {
  // Legge lo stato globale dell'applicazione, oggi usato per il giorno virtuale.
  async getState() {
    const res = await fetch("/api/state");
    if (!res.ok) throw new Error("Impossibile leggere lo stato.");
    return res.json();
  },

  // Avanza di un giorno il tempo virtuale di BlueHarbor.
  async nextDay() {
    const res = await fetch("/api/state/next-day", { method: "POST" });
    if (!res.ok) throw new Error("Impossibile avanzare il giorno.");
    return res.json();
  },

  // Chiede al faro di generare una nuova anteprima di arrivo nave.
  async generateArrival() {
    const res = await fetch("/api/arrivals", { method: "POST" });
    if (!res.ok) throw new Error("Il faro non ha risposto.");
    return res.json();
  },

  // Legge l'elenco delle navi registrate.
  async getShips() {
    const res = await fetch("/api/ships");
    if (!res.ok) throw new Error("Impossibile leggere le navi.");
    return res.json();
  },

  // Legge lo stato calcolato delle banchine.
  async getBerths() {
    const res = await fetch("/api/berths");
    if (!res.ok) throw new Error("Impossibile leggere le banchine.");
    return res.json();
  },

  // Registra una nave unendo dati del faro e metadati inseriti dall'Operatore.
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

  // Assegna una nave Pending alla prima banchina disponibile.
  async assignShip(id) {
    const res = await fetch(`/api/ships/${id}/assign`, { method: "POST" });

    if (!res.ok) {
      const problem = await res.json().catch(() => null);
      throw new Error(problem?.message ?? "Assegnazione nave fallita.");
    }

    return res.json();
  },

  // Cancella una nave. Se era assegnata, la banchina torna libera.
  async deleteShip(id) {
    const res = await fetch(`/api/ships/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Cancellazione nave fallita.");
  },
};
