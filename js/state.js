// ================================================
// STATE.JS — Estado de UI en memoria (no localStorage)
// ================================================

const state = {
  activeTab: 'inicio',
  technicians: [],
  assignments: [],
  sightings: [],
  loaded: { technicians: false, assignments: false, sightings: false },
  informeView: 'calendario', // 'calendario' | 'ficha'
  informeMonth: null, // { year, month } — se inicializa en boot()
  inicioWeekend: null, // fecha ISO del domingo mostrado en Inicio — se inicializa al abrir la pestaña
};

function setState(patch) {
  Object.assign(state, patch);
}
