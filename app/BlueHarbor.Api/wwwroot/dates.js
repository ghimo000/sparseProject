// Converte il giorno virtuale (dato di dominio, mai mostrato com'e) in una data reale per la UI.
const Dates = {
  BaseDate: new Date(2026, 5, 1),

  // Ritorna un oggetto Date reale a partire dal giorno virtuale.
  fromVirtualDay(day) {
    const copy = new Date(this.BaseDate);
    copy.setDate(copy.getDate() + day);
    return copy;
  },

  // Formatta una Date come gg-mm-aaaa.
  format(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}-${date.getFullYear()}`;
  },

  // Scorciatoia: giorno virtuale -> stringa data reale.
  formatVirtualDay(day) {
    return this.format(this.fromVirtualDay(day));
  },
};
