// ================================================
// CONSTANTS.JS — Constantes de la app Técnicos RM
// ================================================

const APP_NAME = 'Fin de Semana';
const LOGO_PATH = './rm.png';
const FOOTER_TEXT = 'Cantera del Real Madrid CF — Fin de Semana';

const SEASON = { start: '2026-09-01', end: '2027-06-30', label: '2026/2027' };

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
  { id: 'alevin-a', name: 'Alevín A', short: 'ALA' },
  { id: 'alevin-b', name: 'Alevín B', short: 'ALB' },
  { id: 'alevin-c', name: 'Alevín C', short: 'ALC' },
  { id: 'benjamin-a', name: 'Benjamín A', short: 'BJA' },
  { id: 'benjamin-b', name: 'Benjamín B', short: 'BJB' },
  { id: 'prebenjamin-a', name: 'Prebenjamín A', short: 'PBA' },
  { id: 'prebenjamin-b', name: 'Prebenjamín B', short: 'PBB' },
  { id: 'debutante', name: 'Debutante', short: 'DEB' },
];

const TABS = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'tecnicos', label: 'Técnicos' },
  { key: 'informe', label: 'Informe general' },
];

function teamById(id) {
  return TEAMS.find((t) => t.id === id) || null;
}

function teamOrderIndex(id) {
  const idx = TEAMS.findIndex((t) => t.id === id);
  return idx === -1 ? TEAMS.length : idx;
}
