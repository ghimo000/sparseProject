const $ = (id) => document.getElementById(id);

// I dati del faro per l'arrivo in corso (anteprima → conferma).
let currentArrival = null;

async function refreshState() {
  const state = await API.getState();
  $("current-day").textContent = state.currentDay;
}

async function refreshShips() {
  const ships = await API.getShips();
  const tbody = document.querySelector("#ships tbody");
  tbody.innerHTML = "";
  for (const s of ships) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${s.size}</td>
      <td>${s.arrivalDay}</td>
      <td>${s.occupationDays}</td>
      <td>${s.status}</td>
      <td>${escapeHtml(s.notes ?? "")}</td>`;
    tbody.appendChild(tr);
  }
}

// 1) L'Operatore chiede un arrivo: il faro genera, mostriamo i dati in sola lettura.
$("btn-arrival").addEventListener("click", async () => {
  try {
    currentArrival = await API.generateArrival();
    $("f-size").textContent = currentArrival.size;
    $("f-offset").textContent = currentArrival.arrivalDayOffset;
    $("f-occupation").textContent = currentArrival.occupationDays;
    $("form-ship").hidden = false;
    $("msg").textContent = "";
    $("i-name").focus();
  } catch (err) {
    $("msg").textContent = "Errore: " + err.message;
  }
});

// 2) L'Operatore aggiunge i metadati e conferma: nasce la nave Pending.
$("form-ship").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentArrival) return;
  try {
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
  } catch (err) {
    $("msg").textContent = "Errore: " + err.message;
  }
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// Avvio
refreshState();
refreshShips();
