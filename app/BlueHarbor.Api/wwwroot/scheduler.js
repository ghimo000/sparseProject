// Scorciatoia per recuperare un elemento HTML tramite id.
const $ = (id) => document.getElementById(id);

// Aggiorna il giorno virtuale mostrato nella pagina Scheduler.
async function refreshState() {
  const state = await API.getState();
  $("current-day").textContent = state.currentDay;
  $("current-date").textContent = state.currentDate;
}

// Carica le navi e aggiorna lista pending e storico.
async function refreshShips() {
  const ships = await API.getShips();
  const pendingShips = ships.filter((ship) => ship.status === "Pending");
  const pendingBody = document.querySelector("#pending-ships tbody");
  const historyBody = document.querySelector("#ships-history tbody");

  pendingBody.innerHTML = "";
  historyBody.innerHTML = "";
  $("empty-pending").hidden = pendingShips.length > 0;
  $("empty-history").hidden = ships.length > 0;

  for (const ship of pendingShips) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ship.id}</td>
      <td>${escapeHtml(ship.name)}</td>
      <td>${ship.size}</td>
      <td>${formatVirtualDay(ship.arrivalDay)}</td>
      <td>${ship.occupationDays}</td>
      <td>${escapeHtml(ship.notes ?? "")}</td>
      <td>
        <div class="table-actions">
          <button type="button" data-assign-id="${ship.id}">Assegna</button>
          <button class="danger" type="button" data-delete-id="${ship.id}">Cancella</button>
        </div>
      </td>`;
    pendingBody.appendChild(tr);
  }

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
      <td>${escapeHtml(ship.notes ?? "")}</td>
      <td><button class="danger" type="button" data-delete-id="${ship.id}">Cancella</button></td>`;
    historyBody.appendChild(tr);
  }
}

// Carica lo stato calcolato delle banchine.
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

// Avanza il giorno e ricarica i dati mostrati dallo Scheduler.
async function nextDay() {
  $("msg").textContent = "";
  await API.nextDay();
  await refreshAll();
}

// Assegna una nave Pending e mostra il banner se e stata spostata.
async function assignShip(id) {
  const result = await API.assignShip(id);
  $("msg").textContent = result.message ?? "Nave assegnata.";
  await refreshAll();
}

// Cancella una nave e aggiorna banchine e storico.
async function deleteShip(id) {
  $("msg").textContent = "";
  await API.deleteShip(id);
  await refreshAll();
}

// Aggiorna tutte le sezioni dipendenti dai dati server.
async function refreshAll() {
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

// Mostra lo stato banchina come etichetta calcolata, non come nuovo stato dominio.
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

// Collega il pulsante Next Day al tempo virtuale.
$("btn-next-day").addEventListener("click", async () => {
  try {
    await nextDay();
  } catch (error) {
    showError(error);
  }
});

// Collega il refresh manuale ai dati della pagina.
$("btn-refresh").addEventListener("click", async () => {
  try {
    $("msg").textContent = "";
    await refreshAll();
  } catch (error) {
    showError(error);
  }
});

// Gestisce i pulsanti generati nelle tabelle.
document.addEventListener("click", async (event) => {
  const assignId = event.target.dataset.assignId;
  const deleteId = event.target.dataset.deleteId;

  try {
    if (assignId) {
      await assignShip(assignId);
    }

    if (deleteId) {
      await deleteShip(deleteId);
    }
  } catch (error) {
    showError(error);
  }
});

// Avvia il caricamento iniziale della pagina Scheduler.
refreshAll();
