// ================================================
// APP.JS — Punto de entrada
// ================================================

const PANEL_RENDERERS = {
  inicio: renderPanelInicio,
  tecnicos: renderPanelTecnicos,
  informe: renderPanelInforme,
};

function safeRender(renderFn, panel) {
  try {
    renderFn(panel);
  } catch (err) {
    console.error('[Render] Fallo en un panel:', err);
    panel.innerHTML = '<div class="rm-card" style="border-color:var(--rm-danger)">' +
      '<p class="rm-card__text">Error al cargar esta pantalla: ' + safeText(err.message) + '<br>Revisa la consola (F12) o que todos los archivos estén subidos.</p></div>';
  }
}

function renderMain() {
  const main = document.getElementById('rm-main');
  main.innerHTML = '';
  TABS.forEach(function (tab) {
    const panel = document.createElement('div');
    panel.className = 'tab-panel' + (tab.key !== state.activeTab ? ' hidden' : '');
    panel.dataset.tab = tab.key;
    main.appendChild(panel);
    const render = PANEL_RENDERERS[tab.key];
    if (render) safeRender(render, panel);
  });
}

function setupEvents() {
  document.addEventListener('rm:tab-changed', function (e) {
    const panel = qs('.tab-panel[data-tab="' + e.detail + '"]');
    const render = PANEL_RENDERERS[e.detail];
    if (panel && render) safeRender(render, panel);
  });
}

function boot() {
  const savedTab = safeStorageGet('rm-active-tab');
  if (savedTab && TABS.some(function (t) { return t.key === savedTab; })) {
    setState({ activeTab: savedTab });
  }

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
