// ================================================
// RENDER-HEADER.JS
// ================================================

function renderHeader() {
  const header = document.getElementById('rm-header');
  if (!header) return;
  const seasons = allSeasons();
  if (!state.selectedSeasonId) setState({ selectedSeasonId: seasons[seasons.length - 1].id });

  header.className = 'rm-header';
  header.innerHTML =
    '<img class="rm-header__crest" src="' + LOGO_PATH + '" alt="Escudo" />' +
    '<div class="rm-header__titles">' +
      '<div class="rm-header__title">' + safeText(APP_NAME) + '</div>' +
      '<div class="rm-header__subtitle">Real Madrid · Cantera</div>' +
    '</div>' +
    (seasons.length > 1
      ? '<select class="rm-select season-select" id="season-select">' +
          seasons.map(function (s) { return '<option value="' + s.id + '"' + (s.id === state.selectedSeasonId ? ' selected' : '') + '>' + safeText(s.label) + '</option>'; }).join('') +
        '</select>'
      : '<span class="header-season-label">' + safeText(seasonById(state.selectedSeasonId).label) + '</span>') +
    '<button class="rm-header__action" type="button" id="btn-add-season" title="Nueva temporada">+</button>' +
    '<button class="rm-header__action" type="button" data-rm-theme-toggle aria-label="Activar modo oscuro">☾</button>';

  const select = qs('#season-select', header);
  if (select) {
    select.addEventListener('change', function () {
      setState({ selectedSeasonId: select.value });
      renderMain();
    });
  }
  qs('#btn-add-season', header).addEventListener('click', function () { openAddSeasonModal(); });
}
