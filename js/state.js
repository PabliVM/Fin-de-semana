// ================================================
// STATE.JS — Estado de UI en memoria (no localStorage)
// ================================================

const state = {
  activeTab: 'inicio',
  technicians: [],
  assignments: [],
  sightings: [],
  loaded: { technicians: false, assignments: false, sightings: false },
};

function setState(patch) {
  Object.assign(state, patch);
}
