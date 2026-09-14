// ================================================
// CONSTANTS.JS — Constantes de la app Técnicos RM
// ================================================

const APP_NAME = 'Fin de Semana';
const LOGO_PATH = './rm.png';
const FOOTER_TEXT = 'Cantera del Real Madrid CF — Fin de Semana';

const SEASON = { start: '2026-09-01', end: '2027-06-30', label: '2026/2027' };

// ⚠ ASUNCIÓN: lista de equipos provisional tomada de los ejemplos del documento.
// Confirmar lista real (IDs y nombres) antes de dar por cerrado el módulo.
const TEAMS = [
  { id: 'juvenil-a', name: 'Juvenil A', short: 'JA' },
  { id: 'juvenil-b', name: 'Juvenil B', short: 'JB' },
  { id: 'juvenil-c', name: 'Juvenil C', short: 'JC' },
  { id: 'cadete-a', name: 'Cadete A', short: 'CA' },
  { id: 'infantil-a', name: 'Infantil A', short: 'IA' },
  { id: 'castilla', name: 'Castilla', short: 'CAST' },
  { id: 'rmc', name: 'Real Madrid C', short: 'RMC' },
];

const TABS = [
  { key: 'tecnicos', label: 'Técnicos' },
  { key: 'informe', label: 'Informe general' },
];

function teamById(id) {
  return TEAMS.find((t) => t.id === id) || null;
}
