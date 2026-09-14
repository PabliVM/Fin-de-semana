// ================================================
// STATE.JS — Estado de UI en memoria (no localStorage)
// ================================================

const state = {
  activeTab: 'tecnicos',
  technicians: [],
  assignments: [],
  loaded: { technicians: false, assignments: false },
};

function setState(patch) {
  Object.assign(state, patch);
}
