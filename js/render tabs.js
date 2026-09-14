// ================================================
// RENDER-TABS.JS
// ================================================

function renderTabs() {
  const nav = document.getElementById('rm-tabs');
  if (!nav) return;
  nav.className = 'rm-nav';
  nav.innerHTML = TABS.map(function (tab) {
    return '<button class="rm-nav-button' + (state.activeTab === tab.key ? ' is-active' : '') +
      '" type="button" data-tab="' + tab.key + '">' + safeText(tab.label) + '</button>';
  }).join('');

  qsa('.rm-nav-button', nav).forEach(function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
  });
}

function switchTab(tabKey) {
  if (state.activeTab === tabKey) return;
  setState({ activeTab: tabKey });
  qsa('.rm-nav-button').forEach(function (btn) {
    btn.classList.toggle('is-active', btn.dataset.tab === tabKey);
  });
  qsa('.tab-panel').forEach(function (panel) {
    panel.classList.toggle('hidden', panel.dataset.tab !== tabKey);
  });
  document.dispatchEvent(new CustomEvent('rm:tab-changed', { detail: tabKey }));
}
