// ================================================
// FRIDAY-SHIFTS.JS — Pestaña Turno viernes tarde
// Firestore: colección fridayShifts, doc id `${technicianId}_${weekendDate}`
//   { technicianId, weekendDate, working: true }  — solo existe el doc si trabaja
// Reutiliza: weekendsInSeason() e informe-table (informe.js/app.css),
//            sortedTechnicians() (technicians.js), isTechOffThatWeekend() (timeoff.js)
// ================================================

let _unsubFridayShifts = null;

function initFridayShiftsData() {
  if (isFirebaseUnconfigured()) return;
  _unsubFridayShifts = listenCollection('fridayShifts', function (rows) {
    setState({ fridayShifts: rows });
    if (state.activeTab === 'viernes') safeRender(renderPanelViernes, qs('.tab-panel[data-tab="viernes"]'));
  }, function (err) { showError('Error cargando turnos de viernes: ' + err.message); });
}

function fridayShiftId(technicianId, weekendDate) {
  return technicianId + '_' + weekendDate;
}

function isFridayWorking(technicianId, weekendDate) {
  return state.fridayShifts.some(function (s) { return s.technicianId === technicianId && s.weekendDate === weekendDate; });
}

function toggleFridayShift(technicianId, weekendDate) {
  if (isTechOffThatWeekend(technicianId, weekendDate)) return; // libranza manda, no se puede tocar
  const id = fridayShiftId(technicianId, weekendDate);
  if (isFridayWorking(technicianId, weekendDate)) {
    deleteDocument('fridayShifts', id).catch(function (err) { showError(err.message); });
  } else {
    setDocument('fridayShifts', id, { technicianId: technicianId, weekendDate: weekendDate, working: true })
      .catch(function (err) { showError(err.message); });
  }
}

function renderPanelViernes(container) {
  if (!container) return;
  const weekends = weekendsInSeason();
  const techs = sortedTechnicians().filter(function (t) { return t.active !== false; });
  const totalWeekends = weekends.length;

  container.innerHTML =
    (isFirebaseUnconfigured() ? '<div class="firebase-notice rm-card" style="margin-bottom:16px">⚠ Firebase pendiente de configurar — edita js/firebase-config.js</div>' : '') +
    '<div class="rm-view-heading" style="border:0;padding:0;margin-bottom:16px">' +
      '<h1 class="rm-view-title">Turno viernes tarde</h1>' +
      '<span class="rm-view-subtitle">Haz clic en una celda para marcar/desmarcar el turno. Se guarda solo.</span>' +
    '</div>' +
    (techs.length && weekends.length
      ? '<div class="rm-table-wrap"><table class="rm-table informe-table"><thead><tr>' +
          '<th>Técnico</th>' +
          weekends.map(function (w) { return '<th>' + formatDate(addDaysISO(w, -2)) + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
          techs.map(function (t) { return renderViernesRow(t, weekends); }).join('') +
        '</tbody></table></div>'
      : '<div class="rm-card"><p class="rm-card__text">No hay técnicos activos.</p></div>') +
    '<div class="rm-section-title" style="margin-top:24px">Resumen por técnico</div>' +
    (techs.length
      ? '<div class="assign-list" style="max-width:620px">' +
          techs.map(function (t) { return renderViernesResumenRow(t, totalWeekends); }).join('') +
        '</div>'
      : '');

  qsa('.friday-cell', container).forEach(function (cell) {
    cell.addEventListener('click', function () {
      toggleFridayShift(cell.dataset.technician, cell.dataset.weekend);
    });
  });
}

function renderViernesRow(t, weekends) {
  return (
    '<tr>' +
      '<td>' + safeText(t.initials) + '</td>' +
      weekends.map(function (w) { return renderFridayCell(t.id, w); }).join('') +
    '</tr>'
  );
}

function renderFridayCell(technicianId, weekendDate) {
  const off = isTechOffThatWeekend(technicianId, weekendDate);
  if (off) return '<td class="friday-cell friday-cell--blocked" title="Libra ese finde">✕</td>';
  const working = isFridayWorking(technicianId, weekendDate);
  return '<td class="friday-cell' + (working ? ' friday-cell--on' : '') + '" data-technician="' + technicianId + '" data-weekend="' + weekendDate + '">' + (working ? '✓' : '') + '</td>';
}

function renderViernesResumenRow(t, totalWeekends) {
  const trabajados = state.fridayShifts.filter(function (s) { return s.technicianId === t.id; }).length;
  const librados = state.timeOffRequests.filter(function (r) { return r.technicianId === t.id; }).length;
  const pct = totalWeekends ? Math.round(trabajados / totalWeekends * 100) : 0;
  return (
    '<div class="assign-row">' +
      '<span class="assign-row__team">' + safeText(t.initials) + ' — ' + safeText(t.fullName) + '</span>' +
      '<span class="assign-row__dates">' + trabajados + ' trabajados · ' + librados + ' librados · ' + pct + '%</span>' +
    '</div>'
  );
}
