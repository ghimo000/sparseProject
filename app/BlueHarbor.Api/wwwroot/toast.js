// Notifiche brevi per dare un feedback visivo immediato sulle azioni dell'utente.
window.Toast = {
  container: null,

  ensureContainer() {
    if (this.container) return this.container;
    this.container = document.createElement("div");
    this.container.className = "toast-stack";
    document.body.appendChild(this.container);
    return this.container;
  },

  show(message, type = "success") {
    const container = this.ensureContainer();
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;

    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = type === "error" ? "⚠" : "✓";

    const text = document.createElement("span");
    text.textContent = message;

    el.append(icon, text);
    container.appendChild(el);

    requestAnimationFrame(() => el.classList.add("visible"));

    setTimeout(() => {
      el.classList.remove("visible");
      el.addEventListener("transitionend", () => el.remove(), { once: true });
    }, 3500);
  },

  success(message) {
    this.show(message, "success");
  },

  error(message) {
    this.show(message, "error");
  },
};
