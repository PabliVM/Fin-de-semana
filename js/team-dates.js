// ================================================
// TEAM-DATES.JS — Fecha de inicio por equipo (config editable)
// Firestore: doc único config/teamDates → { [teamId]: 'YYYY-MM-DD' }
// ================================================

let _unsubTeamDates = null;

function initTeamDatesData() {
  if (isFirebaseUnconfigured()) return;
  _unsubTeamDates = listenDocument('config', 'teamDates', function (data) {
    setState({ teamDates: data || {} });
    // Re-renderizar la pantalla activa si depende de esto
    if (state.activeTab === 'inicio') renderPanelInicio(qs('.tab-panel[data-tab="inicio"]'));
  }, function (err) { showError('Error cargando fechas de equipos: ' + err.message); });
}

function teamStartDate(teamId) {
  return (state.teamDates && state.teamDates[teamId]) || SEASON.start;
}

function isTeamStartedByWeekend(teamId, weekendDate) {
  return teamStartDate(teamId) <= weekendDate;
}

function openTeamDatesModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'rm-modal-backdrop';
  backdrop.innerHTML =
    '<div class="rm-modal">' +
      '<button class="rm-icon-button" id="modal-close" type="button" style="position:absolute;top:16px;right:16px">✕</button>' +
      '<h2 class="rm-modal__title">Fechas de inicio por equipo</h2>' +
      '<p class="rm-card__text" style="margin-bottom:12px">Un equipo no se podrá seleccionar en Inicio para findes anteriores a su fecha de inicio.</p>' +
      '<div class="team-dates-list">' +
        TEAMS.map(function (t) {
          return '<div class="rm-field" style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
            '<label class="rm-label" style="flex:1;margin:0">' + safeText(t.name) + '</label>' +
            '<input class="rm-input" type="date" data-team="' + t.id + '" value="' + teamStartDate(t.id) + '" style="width:170px" />' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="rm-modal__actions">' +
        '<button class="rm-button rm-button--primary" id="modal-save-dates" type="button">Guardar</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(backdrop);

  qs('#modal-close', backdrop).addEventListener('click', function () { backdrop.remove(); });
  backdrop.addEventListener('click', function (e) { if (e.target === backdrop) backdrop.remove(); });

  qs('#modal-save-dates', backdrop).addEventListener('click', function () {
    const patch = {};
    qsa('input[data-team]', backdrop).forEach(function (input) {
      patch[input.dataset.team] = input.value || SEASON.start;
    });
    setDocument('config', 'teamDates', patch)
      .then(function () { showSuccess('Fechas guardadas.'); backdrop.remove(); })
      .catch(function (err) { showError(err.message); });
  });
}
