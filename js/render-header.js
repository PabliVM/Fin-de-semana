// ================================================
// RENDER-HEADER.JS
// ================================================

function renderHeader() {
  const header = document.getElementById('rm-header');
  if (!header) return;
  if (!state.selectedSeasonId) setState({ selectedSeasonId: SEASONS[SEASONS.length - 1].id });

  header.className = 'rm-header';
  header.innerHTML =
    '<img class="rm-header__crest" src="' + LOGO_PATH + '" alt="Escudo" />' +
    '<div class="rm-header__titles">' +
      '<div class="rm-header__title">' + safeText(APP_NAME) + '</div>' +
      '<div class="rm-header__subtitle">Real Madrid · Cantera</div>' +
    '</div>' +
    (SEASONS.length > 1
      ? '<select class="rm-select season-select" id="season-select">' +
          SEASONS.map(function (s) { return '<option value="' + s.id + '"' + (s.id === state.selectedSeasonId ? ' selected' : '') + '>' + safeText(s.label) + '</option>'; }).join('') +
        '</select>'
      : '<span class="header-season-label">' + safeText(seasonById(state.selectedSeasonId).label) + '</span>') +
    '<button class="rm-header__action" type="button" data-rm-theme-toggle aria-label="Activar modo oscuro">☾</button>';

  const select = qs('#season-select', header);
  if (select) {
    select.addEventListener('change', function () {
      setState({ selectedSeasonId: select.value });
      renderMain();
    });
  }
}
