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
    if (state.activeTab === 'inicio') safeRender(renderPanelInicio, qs('.tab-panel[data-tab="inicio"]'));
    if (state.activeTab === 'informe') safeRender(renderPanelInforme, qs('.tab-panel[data-tab="informe"]'));
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

function ensureInicioWeekend() {
  if (!state.inicioWeekend) setState({ inicioWeekend: nextWeekendDate() });
}

function shiftInicioWeek(delta) {
  ensureInicioWeekend();
  setState({ inicioWeekend: addDaysISO(state.inicioWeekend, delta * 7) });
  safeRender(renderPanelInicio, qs('.tab-panel[data-tab="inicio"]'));
}

function teamOptionsFor(currentValue) {
  return '<option value="">—</option>' +
    TEAMS.map(function (t) { return '<option value="' + t.id + '">' + safeText(t.short) + '</option>'; }).join('');
}

function renderPanelInicio(container) {
  if (!container) return;
  ensureInicioWeekend();
  const weekendDate = state.inicioWeekend;
  const activeTechs = state.technicians
    .filter(function (t) { return t.active !== false; })
    .sort(function (a, b) { return (a.order || 0) - (b.order || 0) || (a.fullName || '').localeCompare(b.fullName || ''); });

  container.innerHTML =
    (isFirebaseUnconfigured() ? '<div class="firebase-notice rm-card" style="margin-bottom:16px">⚠ Firebase pendiente de configurar — edita js/firebase-config.js</div>' : '') +
    '<div class="rm-view-heading" style="border:0;padding:0;margin-bottom:16px">' +
      '<h1 class="rm-view-title">Registro del finde</h1>' +
    '</div>' +
    '<div class="informe-month-nav">' +
      '<button class="rm-icon-button" id="inicio-prev" type="button">‹</button>' +
      '<span class="informe-month-label">Fin de semana del ' + formatDate(weekendDate) + '</span>' +
      '<button class="rm-icon-button" id="inicio-next" type="button">›</button>' +
    '</div>' +
    (activeTechs.length ? renderSightingsTable(activeTechs, weekendDate)
      : '<div class="rm-card"><p class="rm-card__text">No hay técnicos activos. Da de alta técnicos en la pestaña Técnicos.</p></div>');

  qs('#inicio-prev', container).addEventListener('click', function () { shiftInicioWeek(-1); });
  qs('#inicio-next', container).addEventListener('click', function () { shiftInicioWeek(1); });

  qsa('select[data-technician][data-slot], input[data-technician][data-slot]', container).forEach(function (el) {
    el.addEventListener('change', function () { onSightingChange(el, weekendDate); });
  });
}

function renderOffRow(t, off) {
  return (
    '<tr class="sightings-row-off">' +
      '<td>' + safeText(t.initials) + ' — ' + safeText(t.fullName) + '</td>' +
      '<td colspan="2"><span class="rm-badge rm-badge--warning">Librando' + (off.note ? ' · ' + safeText(off.note) : '') + '</span></td>' +
      '<td>—</td>' +
    '</tr>'
  );
}

function renderSightingsTable(techs, weekendDate) {
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
            const off = timeOffFor(t.id, weekendDate);
            if (off) return renderOffRow(t, off);
            const sighting = sightingFor(t.id, weekendDate);
            const v1 = sighting ? sighting.team1 || '' : '';
            const v2 = sighting ? sighting.team2 || '' : '';
            const notes = sighting ? sighting.notes || '' : '';
            return (
              '<tr>' +
                '<td>' + safeText(t.initials) + ' — ' + safeText(t.fullName) + '</td>' +
                '<td><select class="rm-select" data-technician="' + t.id + '" data-slot="team1">' +
                  teamOptionsFor(v1).replace('value="' + v1 + '"', 'value="' + v1 + '" selected') + '</select></td>' +
                '<td><select class="rm-select" data-technician="' + t.id + '" data-slot="team2">' +
                  teamOptionsFor(v2).replace('value="' + v2 + '"', 'value="' + v2 + '" selected') + '</select></td>' +
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
