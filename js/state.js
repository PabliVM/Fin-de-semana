// ================================================
// STATE.JS — Estado de UI en memoria (no localStorage)
// ================================================

const state = {
  activeTab: 'inicio',
  technicians: [],
  assignments: [],
  sightings: [],
  timeOffRequests: [],
  fridayShifts: [],
  matches: [],
  loaded: { technicians: false, assignments: false, sightings: false },
  informeView: 'calendario', // 'calendario' | 'ficha'
  informeMonth: null, // { year, month } — se inicializa en boot()
  inicioWeekend: null, // fecha ISO del domingo mostrado en Inicio — se inicializa al abrir la pestaña
  teamDates: {}, // { [teamId]: 'YYYY-MM-DD' } fecha de inicio por equipo, configurable
  fichaTechnicianId: null, // técnico seleccionado en Ficha individual
  calendarioEquiposTeams: [], // [] = todos los equipos; si no, solo estos
  selectedSeasonId: null, // se inicializa en boot() a la última temporada
};

function setState(patch) {
  Object.assign(state, patch);
}
