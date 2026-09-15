// ================================================
// TIMEOFF.JS — Pestaña Libranzas: findes libres por técnico
// Firestore: colección timeOffRequests { technicianId, weekendDate, note }
// ================================================

let _unsubTimeOff = null;

function initTimeOffData() {
  if (isFirebaseUnconfigured()) return;
  _unsubTimeOff = listenCollection('timeOffRequests', function (rows) {
    setState({ timeOffRequests: rows });
    if (state.activeTab === 'libranzas') safeRender(renderPanelLibranzas, qs('.tab-panel[data-tab="libranzas"]'));
    if (state.activeTab === 'inicio') safeRender(renderPanelInicio, qs('.tab-panel[data-tab="inicio"]'));
    if (state.activeTab === 'viernes') safeRender(renderPanelViernes, qs('.tab-panel[data-tab="viernes"]'));
  }, function (err) { showError('Error cargando libranzas: ' + err.message); });
}

function isTechOffThatWeekend(technicianId, weekendDate) {
  return state.timeOffRequests.some(function (r) { return r.technicianId === technicianId && r.weekendDate === weekendDate; });
}

function timeOffFor(technicianId, weekendDate) {
  return state.timeOffRequests.find(function (r) { return r.technicianId === technicianId && r.weekendDate === weekendDate; }) || null;
}

function renderPanelLibranzas(container) {
  if (!container) return;
  const techs = sortedTechnicians().filter(function (t) { return t.active !== false; });
  const upcoming = state.timeOffRequests
    .slice()
    .sort(function (a, b) { return (a.weekendDate || '').localeCompare(b.weekendDate || ''); });

  container.innerHTML =
    (isFirebaseUnconfigured() ? '<div class="firebase-notice rm-card" style="margin-bottom:16px">⚠ Firebase pendiente de configurar — edita js/firebase-config.js</div>' : '') +
    '<div class="rm-view-heading" style="border:0;padding:0;margin-bottom:16px">' +
      '<h1 class="rm-view-title">Libranzas</h1>' +
      '<span class="rm-view-subtitle">Findes en los que un técnico no está disponible</span>' +
    '</div>' +
    '<div class="rm-card" style="max-width:560px;margin-bottom:20px">' +
      '<div class="rm-grid">' +
        '<div class="rm-field"><label class="rm-label">Técnico</label>' +
          '<select class="rm-select" id="lb-tech">' +
            techs.map(function (t) { return '<option value="' + t.id + '">' + safeText(t.fullName) + '</option>'; }).join('') +
          '</select></div>' +
        '<div class="rm-field"><label class="rm-label">Fin de semana</label>' +
          '<input class="rm-input" id="lb-date" type="date" value="' + nextWeekendDate() + '" /></div>' +
      '</div>' +
      '<div class="rm-field"><label class="rm-label">Motivo (opcional)</label>' +
        '<input class="rm-input" id="lb-note" type="text" placeholder="—" /></div>' +
      '<button class="rm-button rm-button--primary rm-button--small" id="lb-add" type="button">+ Añadir libranza</button>' +
    '</div>' +
    '<div class="rm-section-title">Libranzas registradas</div>' +
    (upcoming.length
      ? '<div class="assign-list" style="max-width:560px">' +
          upcoming.map(renderLibranzaRow).join('') +
        '</div>'
      : '<p class="rm-card__text">No hay libranzas registradas.</p>');

  qs('#lb-add', container).addEventListener('click', function () {
    const technicianId = qs('#lb-tech', container).value;
    const rawDate = qs('#lb-date', container).value;
    const note = qs('#lb-note', container).value.trim();
    if (!technicianId || !rawDate) { showError('Elige técnico y fecha.'); return; }
    const weekendDate = nextWeekendDate(rawDate); // ajusta al domingo de esa semana
    addDocument('timeOffRequests', { technicianId: technicianId, weekendDate: weekendDate, note: note })
      .then(function () {
        showSuccess('Libranza añadida.');
        return deleteDocument('fridayShifts', fridayShiftId(technicianId, weekendDate));
      })
      .catch(function (err) { showError(err.message); });
  });

  qsa('[data-action="delete-libranza"]', container).forEach(function (btn) {
    btn.addEventListener('click', function () {
      deleteDocument('timeOffRequests', btn.dataset.id)
        .then(function () { showSuccess('Libranza eliminada.'); })
        .catch(function (err) { showError(err.message); });
    });
  });
}

function renderLibranzaRow(r) {
  const tech = state.technicians.find(function (t) { return t.id === r.technicianId; });
  return (
    '<div class="assign-row">' +
      '<span class="assign-row__team">' + safeText(tech ? tech.fullName : '—') + ' — ' + formatDate(r.weekendDate) + (r.note ? ' (' + safeText(r.note) + ')' : '') + '</span>' +
      '<button class="rm-button rm-button--ghost rm-button--small" data-action="delete-libranza" data-id="' + r.id + '">Eliminar</button>' +
    '</div>'
  );
}
