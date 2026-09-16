// ================================================
// SIGHTINGS.JS — Colección "sightings" (histórico del registro por finde)
// La pantalla de Inicio ya no usa esto (ver team-day-matrix.js) — el partido
// es ahora el dato principal. Se mantiene la carga porque Informe general y
// Ficha individual todavía leen de aquí (pendiente el rework a partidos).
// ================================================

let _unsubSightings = null;

function initSightingsData() {
  if (isFirebaseUnconfigured()) return;
  _unsubSightings = listenCollection('sightings', function (rows) {
    setState({ sightings: rows, loaded: Object.assign({}, state.loaded, { sightings: true }) });
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
