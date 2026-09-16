// ================================================
// CONSTANTS.JS — Constantes de la app Técnicos RM
// ================================================

const APP_NAME = 'Coordinación Equipos';
const LOGO_PATH = './rm.png';
const FOOTER_TEXT = 'Cantera del Real Madrid CF — Coordinación Equipos';

// Para añadir una temporada nueva, añade otro objeto aquí (id único).
const SEASONS = [
  { id: '2026-2027', start: '2026-09-01', end: '2027-06-30', label: '2026/2027' },
];

function allSeasons() {
  return SEASONS.concat(state.extraSeasons || []);
}

function seasonById(id) {
  const list = allSeasons();
  return list.find((s) => s.id === id) || list[list.length - 1];
}

// Equipos Cantera, orden confirmado por Pablo.
const TEAMS = [
  { id: 'castilla', name: 'Castilla', short: 'CAS' },
  { id: 'rmc', name: 'RMC', short: 'RMC' },
  { id: 'juvenil-a', name: 'Juvenil A', short: 'JA' },
  { id: 'juvenil-b', name: 'Juvenil B', short: 'JB' },
  { id: 'juvenil-c', name: 'Juvenil C', short: 'JC' },
  { id: 'cadete-a', name: 'Cadete A', short: 'CA' },
  { id: 'cadete-b', name: 'Cadete B', short: 'CB' },
  { id: 'infantil-a', name: 'Infantil A', short: 'IA' },
  { id: 'infantil-b', name: 'Infantil B', short: 'IB' },
  { id: 'alevin-a', name: 'Alevín A', short: 'AA' },
  { id: 'alevin-b', name: 'Alevín B', short: 'AB' },
  { id: 'alevin-c', name: 'Alevín C', short: 'AC' },
  { id: 'benjamin-a', name: 'Benjamín A', short: 'BA' },
  { id: 'benjamin-b', name: 'Benjamín B', short: 'BB' },
  { id: 'prebenjamin-a', name: 'Prebenjamín A', short: 'PA' },
  { id: 'prebenjamin-b', name: 'Prebenjamín B', short: 'PB' },
  { id: 'debutante', name: 'Debutante', short: 'DB' },
];

const TABS = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'tecnicos', label: 'Técnicos' },
  { key: 'libranzas', label: 'Libranzas' },
  { key: 'viernes', label: 'Turno viernes tarde' },
  { key: 'calendario-equipos', label: 'Calendario equipos' },
  { key: 'informe', label: 'Informe general' },
];

const MATCH_TYPES = [
  { id: 'liga', label: 'Liga' },
  { id: 'amistoso', label: 'Amistoso' },
  { id: 'torneo', label: 'Torneo' },
];

function matchTypeLabel(id) {
  const t = MATCH_TYPES.find((m) => m.id === id);
  return t ? t.label : id;
}

function teamById(id) {
  return TEAMS.find((t) => t.id === id) || null;
}

function teamOrderIndex(id) {
  const idx = TEAMS.findIndex((t) => t.id === id);
  return idx === -1 ? TEAMS.length : idx;
}
