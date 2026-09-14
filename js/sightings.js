// ================================================
// SIGHTINGS.JS — Pestaña Inicio: registro de visionados del finde
// Colección Firestore: sightings
//   doc id: `${technicianId}_${weekendDate}`
//   { technicianId, weekendDate, team1: teamId|null, team2: teamId|null }
// ================================================

let _unsubSightings = null;

function initSightingsData() {
  if (isFirebaseUnconfigured()) return;
  _unsubSightings = listenCollection('sightings', function (rows) {
    setState({ sightings: rows, loaded: Object.assign({}, state.loaded, { sightings: true }) });
    if (state.activeTab === 'inicio') renderPanelInicio(qs('.tab-panel[data-tab="inicio"]'));
  }, function (err) { showError('Error cargando visionados: ' + err.message); });
}

function sightingId(technicianId, weekendDate) {
  return technicianId + '_' + weekendDate;
}

function sightingFor(technicianId, weekendDate) {
  return state.sightings.find(function (s) {
    return s.technicianId === technicianId && s.weekendDate === weekendDate;
  }) || null;
}

function renderPanelInicio(container) {
  if (!container) return;
  const weekendDate = nextWeekendDate();
  const activeTechs = state.technicians
    .filter(function (t) { return t.active !== false; })
    .sort(function (a, b) { return (a.order || 0) - (b.order || 0) || (a.fullName || '').localeCompare(b.fullName || ''); });

  const teamOptions = '<option value="">—</option>' +
    TEAMS.map(function (t) { return '<option value="' + t.id + '">' + safeText(t.name) + '</option>'; }).join('');

  container.innerHTML =
    (isFirebaseUnconfigured() ? '<div class="firebase-notice rm-card" style="margin-bottom:16px">⚠ Firebase pendiente de configurar — edita js/firebase-config.js</div>' : '') +
    '<div class="rm-view-heading" style="border:0;padding:0;margin-bottom:16px">' +
      '<h1 class="rm-view-title">Registro del finde</h1>' +
      '<span class="rm-view-subtitle">Fin de semana del ' + formatDate(weekendDate) + '</span>' +
    '</div>' +
    (activeTechs.length ? renderSightingsTable(activeTechs, weekendDate, teamOptions)
      : '<div class="rm-card"><p class="rm-card__text">No hay técnicos activos. Da de alta técnicos en la pestaña Técnicos.</p></div>');

  qsa('select[data-technician][data-slot], input[data-technician][data-slot]', container).forEach(function (el) {
    el.addEventListener('change', function () { onSightingChange(el, weekendDate); });
  });
}

function renderSightingsTable(techs, weekendDate, teamOptions) {
  return (
    '<div class="rm-table-wrap">' +
      '<table class="rm-table sightings-table">' +
        '<thead><tr>' +
          '<th>Técnico</th>' +
          '<th colspan="2">' + formatDate(weekendDate) + '</th>' +
          '<th>Observaciones</th>' +
        '</tr></thead>' +
        '<tbody>' +
          techs.map(function (t) {
            const sighting = sightingFor(t.id, weekendDate);
            const v1 = sighting ? sighting.team1 || '' : '';
            const v2 = sighting ? sighting.team2 || '' : '';
            const notes = sighting ? sighting.notes || '' : '';
            return (
              '<tr>' +
                '<td>' + safeText(t.initials) + ' — ' + safeText(t.fullName) + '</td>' +
                '<td><select class="rm-select" data-technician="' + t.id + '" data-slot="team1">' +
                  teamOptions.replace('value="' + v1 + '"', 'value="' + v1 + '" selected') + '</select></td>' +
                '<td><select class="rm-select" data-technician="' + t.id + '" data-slot="team2">' +
                  teamOptions.replace('value="' + v2 + '"', 'value="' + v2 + '" selected') + '</select></td>' +
                '<td><input class="rm-input" type="text" data-technician="' + t.id + '" data-slot="notes" value="' + safeText(notes) + '" placeholder="—" /></td>' +
              '</tr>'
            );
          }).join('') +
        '</tbody>' +
      '</table>' +
    '</div>'
  );
}

function onSightingChange(el, weekendDate) {
  const technicianId = el.dataset.technician;
  const slot = el.dataset.slot; // 'team1' | 'team2' | 'notes'

  if (slot === 'notes') {
    setDocument('sightings', sightingId(technicianId, weekendDate), {
      technicianId: technicianId, weekendDate: weekendDate, notes: el.value.trim(),
    })
      .then(function () { showSuccess('Guardado.'); })
      .catch(function (err) { showError(err.message); });
    return;
  }

  const otherSlot = slot === 'team1' ? 'team2' : 'team1';
  const row = el.closest('tr');
  const otherSelect = qs('select[data-slot="' + otherSlot + '"]', row);
  const value = el.value || null;

  if (value && otherSelect && otherSelect.value === value) {
    showError('Ese técnico ya tiene ese equipo en el otro hueco.');
    el.value = '';
    return;
  }

  const patch = {};
  patch[slot] = value;

  setDocument('sightings', sightingId(technicianId, weekendDate), Object.assign(
    { technicianId: technicianId, weekendDate: weekendDate },
    patch
  ))
    .then(function () { showSuccess('Guardado.'); })
    .catch(function (err) { showError(err.message); });
}
