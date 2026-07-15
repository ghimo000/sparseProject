// Scorciatoia per recuperare un elemento HTML tramite id.
const $ = (id) => document.getElementById(id);

// I dati del faro per l'arrivo in corso: prima anteprima, poi conferma.
let currentArrival = null;

// Aggiorna il giorno virtuale mostrato nella pagina Operatore.
async function refreshState() {
  const state = await API.getState();
  $("current-day").textContent = state.currentDay;
  $("current-date").textContent = state.currentDate;
}

// Carica tutte le navi registrate e le mostra nella tabella Operatore.
async function refreshShips() {
  const ships = await API.getShips();
  const tbody = document.querySelector("#ships tbody");

  tbody.innerHTML = "";

  for (const ship of ships) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ship.id}</td>
      <td>${escapeHtml(ship.name)}</td>
      <td>${ship.size}</td>
      <td>${escapeHtml(ship.berthName ?? "-")}</td>
      <td>${formatVirtualDay(ship.arrivalDay)}</td>
      <td>${ship.occupationDays}</td>
      <td>${ship.status}</td>
      <td>${escapeHtml(ship.notes ?? "")}</td>`;
    tbody.appendChild(tr);
  }
}

// Mostra all'Operatore lo stato banchine in sola lettura.
async function refreshBerths() {
  const berths = await API.getBerths();
  const tbody = document.querySelector("#berths tbody");

  tbody.innerHTML = "";

  for (const berth of berths) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${berth.name}</td>
      <td>${berth.size}</td>
      <td>${formatBerthStatus(berth.status)}</td>
      <td>${formatShipSummary(berth.currentShip)}</td>
      <td>${formatShipSummary(berth.nextReservation)}</td>`;
    tbody.appendChild(tr);
  }
}

// Chiede al faro una nuova anteprima e mostra i dati in sola lettura.
async function generateArrival() {
  currentArrival = await API.generateArrival();
  $("f-size").textContent = currentArrival.size;
  $("f-offset").textContent = currentArrival.arrivalDayOffset;
  $("f-occupation").textContent = currentArrival.occupationDays;
  $("form-ship").hidden = false;
  $("msg").textContent = "";
  $("i-name").focus();
}

// Registra la nave usando i dati del faro e i metadati inseriti dall'Operatore.
async function createShip(event) {
  event.preventDefault();

  if (!currentArrival) {
    return;
  }

  await API.createShip({
    name: $("i-name").value,
    notes: $("i-notes").value,
    size: currentArrival.size,
    arrivalDayOffset: currentArrival.arrivalDayOffset,
    occupationDays: currentArrival.occupationDays,
  });

  $("form-ship").reset();
  $("form-ship").hidden = true;
  currentArrival = null;
  $("msg").textContent = "";
  await refreshShips();
  await refreshBerths();
}

// Aggiorna tutti i dati visibili senza ricaricare la pagina.
async function refreshAll() {
  $("msg").textContent = "";
  await refreshState();
  await refreshShips();
  await refreshBerths();
}

// Mostra un messaggio di errore semplice nella pagina.
function showError(error) {
  $("msg").textContent = "Errore: " + error.message;
}

// Converte un giorno virtuale nella data fittizia mostrata in UI.
function formatVirtualDay(day) {
  return `Giorno ${day} - ${formatDate(addDays(new Date(2026, 5, 1), day))}`;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

// Mostra lo stato banchina come dato calcolato, senza introdurre nuovi stati nave.
function formatBerthStatus(status) {
  const isOccupied = status === "Occupied";
  const label = isOccupied ? "Occupata" : "Libera";
  const css = isOccupied ? "status-occupied" : "status-free";
  return `<span class="status ${css}">${label}</span>`;
}

function formatShipSummary(ship) {
  if (!ship) {
    return "-";
  }

  return `${escapeHtml(ship.name)} (${formatPeriod(ship.arrivalDay, ship.endDay)})`;
}

function formatPeriod(startDay, endDay) {
  return `giorni ${startDay}-${endDay}`;
}

// Protegge la tabella da testo inserito dall'utente interpretato come HTML.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])
  );
}

// Collega il pulsante del faro alla generazione dell'anteprima.
$("btn-arrival").addEventListener("click", async () => {
  try {
    await generateArrival();
  } catch (error) {
    showError(error);
  }
});

// Collega il refresh manuale ai dati della pagina.
$("btn-refresh").addEventListener("click", async () => {
  try {
    await refreshAll();
  } catch (error) {
    showError(error);
  }
});

// Collega il form alla registrazione della nave.
$("form-ship").addEventListener("submit", async (event) => {
  try {
    await createShip(event);
  } catch (error) {
    showError(error);
  }
});

// Avvia il caricamento iniziale della pagina Operatore.
refreshAll();
