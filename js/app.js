// ================================================
// APP.JS — Punto de entrada
// ================================================

function renderPanelInforme(container) {
  container.innerHTML =
    '<div class="rm-view-heading" style="border:0;padding:0;margin-bottom:16px">' +
      '<h1 class="rm-view-title">Informe general</h1>' +
      '<span class="rm-view-subtitle">Pendiente — siguiente módulo</span>' +
    '</div>' +
    '<div class="rm-card"><p class="rm-card__text">' +
    'Aquí irá la matriz técnicos × fines de semana con los visionados (secciones 2 a 12 del documento). ' +
    'Necesita primero el registro de partidos/visionados.' +
    '</p></div>';
}

const PANEL_RENDERERS = {
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
  initFirebase();
  initTechniciansData();
  renderHeader();
  renderTabs();
  renderFooter();
  renderMain();
  setupEvents();
}

document.addEventListener('DOMContentLoaded', boot);
