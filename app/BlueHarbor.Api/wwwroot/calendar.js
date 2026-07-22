// Scorciatoia per recuperare un elemento HTML tramite id.
const $ = (id) => document.getElementById(id);

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

// Mese attualmente mostrato (primo giorno del mese, ora azzerata).
// Viene allineato al giorno "oggi" dell'app (non alla data reale del computer) al primo caricamento.
let viewedMonth = startOfMonth(new Date());
let monthInitialized = false;

// Data reale corrispondente al giorno virtuale corrente dell'app: e questo il vero "oggi",
// non la data del computer, altrimenti il calendario apre un mese senza nessuna nave.
let appToday = null;

// Giorno selezionato nel pannello dettaglio.
let selectedKey = null;

// Tutte le navi, ricaricate a ogni ingresso nella pagina.
let allShips = [];

// Elenco statico delle banchine (nome e taglia): non cambia da un giorno all'altro,
// quindi basta caricarlo una volta all'ingresso nella pagina.
let allBerths = [];

// Ricorda da quale pagina si e aperto il calendario in questa sessione del browser,
// cosi il link "torna indietro" punta solo li e non anche all'altro ruolo.
function setupBackLink() {
  const FROM_PAGES = { operator: "operator.html", scheduler: "scheduler.html" };
  const FROM_LABELS = { operator: "Torna al Registro navi", scheduler: "Torna alle Assegnazioni" };

  const requested = new URLSearchParams(window.location.search).get("from");
  const from = requested in FROM_PAGES ? requested : sessionStorage.getItem("blueharbor-from");

  if (!(from in FROM_PAGES)) return;

  sessionStorage.setItem("blueharbor-from", from);

  const link = $("nav-back");
  link.href = FROM_PAGES[from];
  link.textContent = FROM_LABELS[from];
  link.hidden = false;

  const backIcon = $("btn-back-icon");
  backIcon.hidden = false;
  backIcon.title = FROM_LABELS[from];
  backIcon.setAttribute("aria-label", FROM_LABELS[from]);
  backIcon.addEventListener("click", () => {
    window.location.href = FROM_PAGES[from];
  });
}

setupBackLink();

// Chiave stabile aaaa-mm-gg per raggruppare gli eventi per giorno reale.
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Aggiorna la data reale corrente nella sidebar e allinea il calendario al giorno "oggi" dell'app.
async function refreshState() {
  const state = await API.getState();
  $("current-date").textContent = Dates.formatVirtualDay(state.currentDay);
  appToday = Dates.fromVirtualDay(state.currentDay);

  if (!monthInitialized) {
    viewedMonth = startOfMonth(appToday);
    monthInitialized = true;
  }
}

// Carica le navi e ricostruisce il calendario del mese mostrato.
async function refreshShips() {
  allShips = await API.getShips();
  renderCalendar();

  if (selectedKey) {
    renderDetail(selectedKey);
  }
}

// Carica l'elenco delle banchine (nome e taglia), usato per mostrare lo stato di ognuna nel dettaglio giorno.
async function refreshBerths() {
  const berths = await API.getBerths();
  allBerths = berths.map((berth) => ({ name: berth.name, size: berth.size }));
}

// Costruisce la griglia del mese corrente con gli indicatori arrivi/partenze.
function renderCalendar() {
  $("calendar-month-label").textContent = `${MONTH_NAMES[viewedMonth.getMonth()]} ${viewedMonth.getFullYear()}`;

  const grid = $("calendar-grid");
  grid.innerHTML = "";

  const firstDay = viewedMonth;
  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
  // Lunedi come primo giorno della settimana: getDay() usa 0 = domenica.
  const leadingEmpty = (firstDay.getDay() + 6) % 7;

  for (let i = 0; i < leadingEmpty; i++) {
    grid.appendChild(buildEmptyCell());
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), day);
    grid.appendChild(buildDayCell(date, appToday !== null && sameDay(date, appToday)));
  }
}

function buildEmptyCell() {
  const div = document.createElement("div");
  div.className = "calendar-cell empty";
  return div;
}

function buildDayCell(date, isToday) {
  const key = dateKey(date);
  const events = eventsForDate(date);

  const div = document.createElement("div");
  div.className = "calendar-cell" + (isToday ? " today" : "") + (key === selectedKey ? " selected" : "");
  div.dataset.dateKey = key;

  // Al posto dei semplici pallini: quanti arrivi/partenze ci sono e quante banchine sono
  // occupate quel giorno, cosi il mese si legge a colpo d'occhio senza dover selezionare ogni giorno.
  const badges = [];
  if (events.arrivals.length > 0) {
    badges.push(`<span class="calendar-badge arrival" title="Arrivi">&#8595;${events.arrivals.length}</span>`);
  }
  if (events.departures.length > 0) {
    badges.push(`<span class="calendar-badge departure" title="Partenze">&#8593;${events.departures.length}</span>`);
  }

  const occupiedBerths = events.berths.length;
  const totalBerths = allBerths.length;
  const isFull = totalBerths > 0 && occupiedBerths === totalBerths;
  const occupancyLabel = totalBerths > 0
    ? `<span class="calendar-occupancy${isFull ? " full" : ""}" title="Banchine occupate">${occupiedBerths}/${totalBerths} banchine</span>`
    : "";

  div.innerHTML = `
    <span class="cell-day">${date.getDate()}</span>
    <span class="calendar-badges">${badges.join("")}</span>
    ${occupancyLabel}`;

  div.addEventListener("click", () => selectDate(key));
  return div;
}

// Calcola arrivi, partenze e banchine occupate per una data reale, a partire dai giorni virtuali delle navi.
function eventsForDate(date) {
  const arrivals = [];
  const departures = [];
  const berths = [];

  for (const ship of allShips) {
    const arrivalDate = Dates.fromVirtualDay(ship.arrivalDay);
    const departureDate = Dates.fromVirtualDay(ship.arrivalDay + ship.occupationDays - 1);

    if (sameDay(arrivalDate, date)) {
      arrivals.push(ship);
    }

    if (sameDay(departureDate, date)) {
      departures.push(ship);
    }

    if (ship.berthName && date >= arrivalDate && date <= departureDate) {
      berths.push(ship);
    }
  }

  return { arrivals, departures, berths };
}

// Seleziona un giorno: aggiorna evidenziazione griglia e pannello dettaglio.
function selectDate(key) {
  selectedKey = key;
  renderCalendar();
  renderDetail(key);
}

// Mostra il pannello con arrivi, partenze e banchine occupate del giorno selezionato.
function renderDetail(key) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const events = eventsForDate(date);

  $("detail-title").textContent = `Dettaglio del ${Dates.format(date)}`;

  renderDetailList("detail-arrivals", events.arrivals, (ship) => `${escapeHtml(ship.name)} (${ship.size})`);
  renderDetailList("detail-departures", events.departures, (ship) => `${escapeHtml(ship.name)} (${ship.size})`);
  renderBerthGrid(events.berths);
}

// Mostra lo stato (libera/occupata) di ogni banchina per il giorno selezionato, non solo quelle occupate:
// una vista immediata di tutto il terminal in un colpo d'occhio.
function renderBerthGrid(occupyingShips) {
  const grid = $("detail-berths");
  grid.innerHTML = "";

  const shipByBerth = new Map(occupyingShips.map((ship) => [ship.berthName, ship]));

  for (const berth of allBerths) {
    const ship = shipByBerth.get(berth.name);
    const isOccupied = ship !== undefined;

    const card = document.createElement("div");
    card.className = "berth-status-card";
    card.innerHTML = `
      <div class="berth-status-card-header">
        <strong>${escapeHtml(berth.name)}</strong>
        <span class="status ${isOccupied ? "status-occupied" : "status-free"}">${isOccupied ? "Occupata" : "Libera"}</span>
      </div>
      <span class="berth-status-card-ship">${isOccupied ? escapeHtml(ship.name) : "-"}</span>`;
    grid.appendChild(card);
  }
}

function renderDetailList(elementId, items, formatItem) {
  const list = $(elementId);
  list.innerHTML = "";

  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "calendar-detail-empty";
    li.textContent = "Nessuna nave.";
    list.appendChild(li);
    return;
  }

  for (const item of items) {
    const li = document.createElement("li");
    li.innerHTML = formatItem(item);
    list.appendChild(li);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])
  );
}

// Aggiorna tutte le sezioni dipendenti dai dati server.
async function refreshAll() {
  await refreshState();
  await refreshBerths();
  await refreshShips();
}

$("btn-prev-month").addEventListener("click", () => {
  viewedMonth = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() - 1, 1);
  renderCalendar();
});

$("btn-next-month").addEventListener("click", () => {
  viewedMonth = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 1);
  renderCalendar();
});

$("btn-today").addEventListener("click", () => {
  viewedMonth = startOfMonth(appToday ?? new Date());
  renderCalendar();
});

function syncThemeIcon() {
  $("btn-theme").innerHTML = Theme.get() === "dark" ? Theme.icons.sun : Theme.icons.moon;
}

$("btn-theme").addEventListener("click", () => {
  Theme.toggle();
  syncThemeIcon();
});

syncThemeIcon();
refreshAll();
