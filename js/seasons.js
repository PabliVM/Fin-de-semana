// ================================================
// SEASONS.JS — Temporadas añadidas desde la app
// Firestore: colección seasons { label, start, end }
// Se combinan con SEASONS (constants.js) vía allSeasons().
// ================================================

let _unsubSeasons = null;

function initSeasonsData() {
  if (isFirebaseUnconfigured()) return;
  _unsubSeasons = listenCollection('seasons', function (rows) {
    setState({ extraSeasons: rows });
    renderHeader();
  }, function (err) { showError('Error cargando temporadas: ' + err.message); });
}

function openAddSeasonModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'rm-modal-backdrop';
  backdrop.innerHTML =
    '<div class="rm-modal">' +
      '<button class="rm-icon-button" id="modal-close" type="button" style="position:absolute;top:16px;right:16px">✕</button>' +
      '<h2 class="rm-modal__title">Nueva temporada</h2>' +
      '<div class="rm-field"><label class="rm-label">Nombre (ej. 2027/2028)</label>' +
        '<input class="rm-input" id="sea-label" type="text" placeholder="2027/2028" /></div>' +
      '<div class="rm-grid">' +
        '<div class="rm-field"><label class="rm-label">Inicio</label>' +
          '<input class="rm-input" id="sea-start" type="date" /></div>' +
        '<div class="rm-field"><label class="rm-label">Fin</label>' +
          '<input class="rm-input" id="sea-end" type="date" /></div>' +
      '</div>' +
      '<div class="rm-modal__actions">' +
        '<button class="rm-button rm-button--primary" id="modal-save-season" type="button">Guardar</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(backdrop);

  qs('#modal-close', backdrop).addEventListener('click', function () { backdrop.remove(); });
  backdrop.addEventListener('click', function (e) { if (e.target === backdrop) backdrop.remove(); });

  qs('#modal-save-season', backdrop).addEventListener('click', function () {
    const label = qs('#sea-label', backdrop).value.trim();
    const start = qs('#sea-start', backdrop).value;
    const end = qs('#sea-end', backdrop).value;
    if (!label || !start || !end) { showError('Rellena nombre, inicio y fin.'); return; }
    if (end < start) { showError('El fin no puede ser anterior al inicio.'); return; }

    addDocument('seasons', { label: label, start: start, end: end })
      .then(function (newId) {
        showSuccess('Temporada creada.');
        setState({ selectedSeasonId: newId });
        backdrop.remove();
        renderMain();
      })
      .catch(function (err) { showError(err.message); });
  });
}
