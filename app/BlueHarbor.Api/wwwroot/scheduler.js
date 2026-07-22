// Scorciatoia per recuperare un elemento HTML tramite id.
const $ = (id) => document.getElementById(id);

// Disabilita un bottone durante un'azione async, cosi l'utente vede che qualcosa sta succedendo.
async function withBusy(button, busyLabel, action) {
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = busyLabel;

  try {
    return await action();
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

// Aggiorna la data reale mostrata nella pagina Scheduler (mai il giorno virtuale).
async function refreshState() {
  const state = await API.getState();
  $("current-date").textContent = Dates.formatVirtualDay(state.currentDay);
}

// Carica le navi e aggiorna lista pending e storico.
async function refreshShips() {
  const ships = await API.getShips();
  const pendingShips = ships.filter((ship) => ship.status === "Pending");
  // Lo storico dello Scheduler e una vista propria: nascondere una nave qui non deve
  // toccare ne il calendario ne lo storico dell'Operatore, quindi si filtra solo qui.
  const historyShips = ships.filter((ship) => !ship.hiddenFromSchedulerHistory);
  const pendingBody = document.querySelector("#pending-ships tbody");
  const historyBody = document.querySelector("#ships-history tbody");

  pendingBody.innerHTML = "";
  historyBody.innerHTML = "";
  $("empty-pending").hidden = pendingShips.length > 0;
  $("empty-history").hidden = historyShips.length > 0;

  const availableBerthsByShip = await Promise.all(
    pendingShips.map((ship) => API.getAvailableBerths(ship.id))
  );

  pendingShips.forEach((ship, index) => {
    pendingBody.appendChild(buildPendingRow(ship, availableBerthsByShip[index]));
  });

  for (const ship of historyShips) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ship.id}</td>
      <td>${escapeHtml(ship.name)}</td>
      <td>${ship.size}</td>
      <td>${escapeHtml(ship.berthName ?? "-")}</td>
      <td>${Dates.formatVirtualDay(ship.arrivalDay)}</td>
      <td>${Dates.formatVirtualDay(ship.arrivalDay + ship.occupationDays - 1)}</td>
      <td>${ship.status}</td>
      <td>${escapeHtml(ship.notes ?? "")}</td>
      <td><button class="danger" type="button" data-hide-scheduler-history-id="${ship.id}">Cancella</button></td>`;
    historyBody.appendChild(tr);
  }
}

// Costruisce la riga di una nave Pending con il selettore banchina.
function buildPendingRow(ship, availableBerths) {
  const tr = document.createElement("tr");
  const options = availableBerths.length > 0
    ? availableBerths.map((berth) => `<option value="${berth.name}">${berth.name} - ${describeBerthAvailability(berth)}</option>`).join("")
    : `<option value="" disabled selected>Nessuna banchina compatibile libera</option>`;

  tr.innerHTML = `
    <td>${ship.id}</td>
    <td>${escapeHtml(ship.name)}</td>
    <td>${ship.size}</td>
    <td>${Dates.formatVirtualDay(ship.arrivalDay)}</td>
    <td>${Dates.formatVirtualDay(ship.arrivalDay + ship.occupationDays - 1)}</td>
    <td>${escapeHtml(ship.notes ?? "")}</td>
    <td><select data-berth-select="${ship.id}" ${availableBerths.length === 0 ? "disabled" : ""}>${options}</select></td>
    <td>
      <div class="table-actions">
        <button type="button" data-assign-id="${ship.id}" ${availableBerths.length === 0 ? "disabled" : ""}>Assegna</button>
        <button class="danger" type="button" data-delete-id="${ship.id}">Cancella</button>
      </div>
    </td>`;
  return tr;
}

// Descrive quando una banchina compatibile e libera, in data reale.
function describeBerthAvailability(berth) {
  return berth.freeAtRequestedDay ? "libera ora" : `libera dal ${Dates.formatVirtualDay(berth.nextFreeDay)}`;
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
async function nextDay(button) {
  await withBusy(button, "Avanzamento...", () => API.nextDay());
  Toast.success("Avanzamento completato.");
  await refreshAll();
}

// Assegna una nave Pending alla banchina scelta nel selettore della riga.
async function assignShip(id, button) {
  const select = document.querySelector(`[data-berth-select="${id}"]`);
  const berthName = select?.value;

  if (!berthName) {
    Toast.error("Scegli una banchina prima di assegnare.");
    return;
  }

  const result = await withBusy(button, "Assegnazione...", () => API.assignShip(id, berthName));
  Toast.success(result.message ?? "Nave assegnata.");
  await refreshAll();
}

// Cancella una nave e aggiorna banchine e storico.
async function deleteShip(id, button) {
  await withBusy(button, "Cancellazione...", () => API.deleteShip(id));
  Toast.success("Nave cancellata.");
  await refreshAll();
}

// Nasconde una nave dallo storico dello Scheduler: il calendario e lo storico dell'Operatore restano invariati.
async function hideFromSchedulerHistory(id, button) {
  await withBusy(button, "Cancellazione...", () => API.hideFromSchedulerHistory(id));
  Toast.success("Nave rimossa dallo storico dello Scheduler.");
  await refreshShips();
}

// Aggiorna tutte le sezioni dipendenti dai dati server.
async function refreshAll() {
  await refreshState();
  await refreshShips();
  await refreshBerths();
}

// Mostra un messaggio di errore visibile come notifica.
function showError(error) {
  Toast.error("Errore: " + error.message);
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

  return `${escapeHtml(ship.name)} (${Dates.formatVirtualDay(ship.arrivalDay)} - ${Dates.formatVirtualDay(ship.endDay)})`;
}

// Protegge la tabella da testo inserito dall'utente interpretato come HTML.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])
  );
}

// Collega il pulsante Next Day al tempo virtuale.
$("btn-next-day").addEventListener("click", async (event) => {
  try {
    await nextDay(event.target);
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

// Collega il toggle del tema chiaro/scuro e ne aggiorna l'icona.
function syncThemeIcon() {
  $("btn-theme").innerHTML = Theme.get() === "dark" ? Theme.icons.sun : Theme.icons.moon;
}

$("btn-theme").addEventListener("click", () => {
  Theme.toggle();
  syncThemeIcon();
});

syncThemeIcon();

// Gestisce i pulsanti generati nelle tabelle.
document.addEventListener("click", async (event) => {
  const assignId = event.target.dataset.assignId;
  const deleteId = event.target.dataset.deleteId;
  const hideSchedulerHistoryId = event.target.dataset.hideSchedulerHistoryId;

  try {
    if (assignId) {
      await assignShip(assignId, event.target);
    }

    if (deleteId) {
      await deleteShip(deleteId, event.target);
    }

    if (hideSchedulerHistoryId) {
      await hideFromSchedulerHistory(hideSchedulerHistoryId, event.target);
    }
  } catch (error) {
    showError(error);
  }
});

// Avvia il caricamento iniziale della pagina Scheduler.
refreshAll();
