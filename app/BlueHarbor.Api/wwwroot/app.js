// Scorciatoia per recuperare un elemento HTML tramite id.
const $ = (id) => document.getElementById(id);

// I dati del faro per l'arrivo in corso: prima anteprima, poi conferma.
let currentArrival = null;

// Giorno virtuale corrente, noto solo qui: serve a calcolare la data reale dell'anteprima faro.
let currentVirtualDay = 0;

// Nave attualmente in modifica inline nella tabella (solo una alla volta).
let editingShipId = null;

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

// Aggiorna la data reale mostrata nella pagina Operatore (mai il giorno virtuale).
async function refreshState() {
  const state = await API.getState();
  currentVirtualDay = state.currentDay;
  $("current-date").textContent = Dates.formatVirtualDay(state.currentDay);
}

// Carica tutte le navi registrate e le mostra nella tabella Operatore.
async function refreshShips() {
  const ships = await API.getShips();
  // Lo storico dell'Operatore e una vista propria: nascondere una nave qui non deve
  // toccare ne il calendario ne lo storico dello Scheduler, quindi si filtra solo qui.
  const visibleShips = ships.filter((ship) => !ship.hiddenFromOperatorHistory);
  const tbody = document.querySelector("#ships tbody");

  tbody.innerHTML = "";

  for (const ship of visibleShips) {
    tbody.appendChild(ship.status === "Pending" && ship.id === editingShipId
      ? buildEditableRow(ship)
      : buildShipRow(ship));
  }
}

// Riga normale, sola lettura.
function buildShipRow(ship) {
  const tr = document.createElement("tr");
  const canEdit = ship.status === "Pending";
  tr.innerHTML = `
    <td>${ship.id}</td>
    <td>${escapeHtml(ship.name)}</td>
    <td>${ship.size}</td>
    <td>${escapeHtml(ship.berthName ?? "-")}</td>
    <td>${Dates.formatVirtualDay(ship.arrivalDay)}</td>
    <td>${Dates.formatVirtualDay(ship.arrivalDay + ship.occupationDays - 1)}</td>
    <td>${ship.status}</td>
    <td>${escapeHtml(ship.notes ?? "")}</td>
    <td>
      <div class="table-actions">
        ${canEdit ? `<button type="button" data-edit-id="${ship.id}">Modifica</button>` : ""}
        <button class="danger" type="button" data-hide-operator-history-id="${ship.id}">Cancella</button>
      </div>
    </td>`;
  return tr;
}

// Riga in modifica: nome e note diventano campi editabili.
function buildEditableRow(ship) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${ship.id}</td>
    <td class="inline-edit"><input id="edit-name" type="text" maxlength="100" value="${escapeHtmlAttr(ship.name)}" /></td>
    <td>${ship.size}</td>
    <td>${escapeHtml(ship.berthName ?? "-")}</td>
    <td>${Dates.formatVirtualDay(ship.arrivalDay)}</td>
    <td>${Dates.formatVirtualDay(ship.arrivalDay + ship.occupationDays - 1)}</td>
    <td>${ship.status}</td>
    <td class="inline-edit"><textarea id="edit-notes" maxlength="500" rows="2">${escapeHtml(ship.notes ?? "")}</textarea></td>
    <td>
      <div class="table-actions">
        <button type="button" data-save-id="${ship.id}">Salva</button>
        <button class="secondary" type="button" data-cancel-edit="1">Annulla</button>
      </div>
    </td>`;
  return tr;
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

// Chiede al faro una nuova anteprima e mostra i dati in sola lettura, con data reale d'arrivo.
async function generateArrival() {
  currentArrival = await API.generateArrival();
  $("f-size").textContent = currentArrival.size;
  $("f-arrival").textContent = Dates.formatVirtualDay(currentVirtualDay + currentArrival.arrivalDayOffset);
  $("f-occupation").textContent = currentArrival.occupationDays;
  $("btn-arrival").hidden = true;
  $("form-ship").hidden = false;
  $("i-name").focus();
}

// Registra la nave usando i dati del faro e i metadati inseriti dall'Operatore.
async function createShip(event) {
  event.preventDefault();

  if (!currentArrival) {
    return;
  }

  await withBusy($("btn-create"), "Registrazione...", () =>
    API.createShip({
      name: $("i-name").value,
      notes: $("i-notes").value,
      size: currentArrival.size,
      arrivalDayOffset: currentArrival.arrivalDayOffset,
      occupationDays: currentArrival.occupationDays,
    })
  );

  $("form-ship").reset();
  $("form-ship").hidden = true;
  $("f-size").textContent = "-";
  $("f-arrival").textContent = "-";
  $("f-occupation").textContent = "-";
  $("btn-arrival").hidden = false;
  currentArrival = null;
  Toast.success("Nave registrata.");
  await refreshShips();
  await refreshBerths();
}

// Attiva la modifica inline di nome/note per una nave Pending.
function startEdit(id) {
  editingShipId = id;
  refreshShips();
}

// Annulla la modifica inline senza salvare.
function cancelEdit() {
  editingShipId = null;
  refreshShips();
}

// Salva nome/note della nave in modifica.
async function saveShip(id, button) {
  await withBusy(button, "Salvataggio...", () =>
    API.updateShip(id, {
      name: $("edit-name").value,
      notes: $("edit-notes").value,
    })
  );
  editingShipId = null;
  Toast.success("Nave aggiornata.");
  await refreshShips();
}

// Nasconde una nave dallo storico dell'Operatore: il calendario e lo storico dello Scheduler restano invariati.
async function hideFromOperatorHistory(id, button) {
  await withBusy(button, "Cancellazione...", () => API.hideFromOperatorHistory(id));
  Toast.success("Nave rimossa dallo storico dell'Operatore.");
  await refreshShips();
}

// Aggiorna tutti i dati visibili senza ricaricare la pagina.
async function refreshAll() {
  await refreshState();
  await refreshShips();
  await refreshBerths();
}

// Mostra un messaggio di errore visibile come notifica.
function showError(error) {
  Toast.error("Errore: " + error.message);
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

  return `${escapeHtml(ship.name)} (${Dates.formatVirtualDay(ship.arrivalDay)} - ${Dates.formatVirtualDay(ship.endDay)})`;
}

// Protegge la tabella da testo inserito dall'utente interpretato come HTML.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])
  );
}

// Come escapeHtml, ma sicura anche dentro un attributo value="...".
function escapeHtmlAttr(value) {
  return escapeHtml(value);
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

// Collega il toggle del tema chiaro/scuro e ne aggiorna l'icona.
function syncThemeIcon() {
  $("btn-theme").innerHTML = Theme.get() === "dark" ? Theme.icons.sun : Theme.icons.moon;
}

$("btn-theme").addEventListener("click", () => {
  Theme.toggle();
  syncThemeIcon();
});

syncThemeIcon();

// Collega il form alla registrazione della nave.
$("form-ship").addEventListener("submit", async (event) => {
  try {
    await createShip(event);
  } catch (error) {
    showError(error);
  }
});

// Gestisce i pulsanti generati nella tabella navi (modifica, salva, annulla).
document.querySelector("#ships tbody").addEventListener("click", async (event) => {
  const editId = event.target.dataset.editId;
  const saveId = event.target.dataset.saveId;
  const cancel = event.target.dataset.cancelEdit;
  const hideOperatorHistoryId = event.target.dataset.hideOperatorHistoryId;

  try {
    if (editId) {
      startEdit(Number(editId));
    }

    if (saveId) {
      await saveShip(Number(saveId), event.target);
    }

    if (cancel) {
      cancelEdit();
    }

    if (hideOperatorHistoryId) {
      await hideFromOperatorHistory(Number(hideOperatorHistoryId), event.target);
    }
  } catch (error) {
    showError(error);
  }
});

// Avvia il caricamento iniziale della pagina Operatore.
refreshAll();
