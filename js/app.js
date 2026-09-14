// ================================================
// APP.JS — Punto de entrada
// ================================================

const PANEL_RENDERERS = {
  inicio: renderPanelInicio,
  tecnicos: renderPanelTecnicos,
  informe: renderPanelInforme,
};

function renderMain() {
  const main = document.getElementById('rm-main');
  main.innerHTML = '';
  TABS.forEach(function (tab) {
    const panel = document.createElement('div');
    panel.className = 'tab-panel' + (tab.key !== state.activeTab ? ' hidden' : '');
    panel.dataset.tab = tab.key;
    main.appendChild(panel);
    const render = PANEL_RENDERERS[tab.key];
    if (render) render(panel);
  });
}

function setupEvents() {
  document.addEventListener('rm:tab-changed', function (e) {
    const panel = qs('.tab-panel[data-tab="' + e.detail + '"]');
    const render = PANEL_RENDERERS[e.detail];
    if (panel && render) render(panel);
  });
}

function boot() {
  renderHeader();
  renderTabs();
  renderFooter();
  renderMain();
  setupEvents();

  const firebaseReady = initFirebase();
  if (firebaseReady) {
    initTechniciansData();
    initSightingsData();
  }
}

document.addEventListener('DOMContentLoaded', boot);
