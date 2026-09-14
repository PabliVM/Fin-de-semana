// ================================================
// RENDER-HEADER.JS
// ================================================

function renderHeader() {
  const header = document.getElementById('rm-header');
  if (!header) return;
  header.className = 'rm-header';
  header.innerHTML =
    '<img class="rm-header__crest" src="' + LOGO_PATH + '" alt="Escudo" />' +
    '<div class="rm-header__titles">' +
      '<div class="rm-header__title">' + safeText(APP_NAME) + '</div>' +
      '<div class="rm-header__subtitle">Real Madrid · Cantera · ' + safeText(SEASON.label) + '</div>' +
    '</div>' +
    '<button class="rm-header__action" type="button" data-rm-theme-toggle aria-label="Activar modo oscuro">☾</button>';
}
