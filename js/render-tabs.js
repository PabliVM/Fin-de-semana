// ================================================
// RENDER-TABS.JS — Navegación de 2 niveles: grupo (Equipos/Coordinadores) + pestaña
// ================================================

function renderTabs() {
  renderGroups();
  renderSubTabs();
}

function renderGroups() {
  const groupsNav = document.getElementById('rm-groups');
  if (!groupsNav) return;
  groupsNav.className = 'rm-nav rm-groups-nav';
  groupsNav.innerHTML = TAB_GROUPS.map(function (g) {
    return '<button class="rm-nav-button' + (state.activeGroup === g.key ? ' is-active' : '') +
      '" type="button" data-group="' + g.key + '">' + safeText(g.label) + '</button>';
  }).join('');

  qsa('.rm-nav-button', groupsNav).forEach(function (btn) {
    btn.addEventListener('click', function () { switchGroup(btn.dataset.group); });
  });
}

function renderSubTabs() {
  const nav = document.getElementById('rm-tabs');
  if (!nav) return;
  const tabsInGroup = TABS.filter(function (t) { return t.group === state.activeGroup; });
  nav.className = 'rm-nav';
  nav.innerHTML = tabsInGroup.map(function (tab) {
    return '<button class="rm-nav-button' + (state.activeTab === tab.key ? ' is-active' : '') +
      '" type="button" data-tab="' + tab.key + '">' + safeText(tab.label) + '</button>';
  }).join('');

  qsa('.rm-nav-button', nav).forEach(function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
  });
}

function switchGroup(groupKey) {
  if (state.activeGroup === groupKey) return;
  const firstTab = TABS.find(function (t) { return t.group === groupKey; });
  setState({ activeGroup: groupKey });
  renderGroups();
  if (firstTab) switchTab(firstTab.key);
}

function switchTab(tabKey) {
  const tab = TABS.find(function (t) { return t.key === tabKey; });
  if (tab && state.activeGroup !== tab.group) setState({ activeGroup: tab.group });
  if (state.activeTab === tabKey) { renderSubTabs(); return; }
  setState({ activeTab: tabKey });
  safeStorageSet('rm-active-tab', tabKey);
  renderSubTabs();
  qsa('.tab-panel').forEach(function (panel) {
    panel.classList.toggle('hidden', panel.dataset.tab !== tabKey);
  });
  document.dispatchEvent(new CustomEvent('rm:tab-changed', { detail: tabKey }));
}
