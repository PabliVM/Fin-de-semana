(function () {
  const storageKey = "rm-ui-theme";
  const root = document.documentElement;

  function applyTheme(theme) {
    root.dataset.rmTheme = theme;
    document.querySelectorAll("[data-rm-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-label", theme === "dark" ? "Activar modo claro" : "Activar modo oscuro");
      button.textContent = theme === "dark" ? "☀" : "☾";
    });
  }

  function safeGet() {
    try { return localStorage.getItem(storageKey); } catch (e) { return null; }
  }
  function safeSet(value) {
    try { localStorage.setItem(storageKey, value); } catch (e) { /* origen file:// u otro bloqueo */ }
  }

  const storedTheme = safeGet();
  applyTheme(storedTheme === "dark" ? "dark" : "light");

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-rm-theme-toggle]");
    if (!button) return;

    const nextTheme = root.dataset.rmTheme === "dark" ? "light" : "dark";
    safeSet(nextTheme);
    applyTheme(nextTheme);
  });
})();
