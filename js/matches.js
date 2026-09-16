// ================================================
// MATCHES.JS — Pestaña Calendario equipos (Fase 1: alta/edición manual)
// Firestore: colección matches
//   { date: 'YYYY-MM-DD', time: 'HH:MM', teamId, rival, homeAway: 'local'|'visitante',
//     type: 'Liga'|'Amistoso'|'Torneo', technicianId: id|null }
// Módulo independiente: no toca Inicio/Informe/Libranzas/Viernes.
// ================================================

let _unsubMatches = null;

function initMatchesData() {
  if (isFirebaseUnconfigured()) return;
  _unsubMatches = listenCollection('matches', function (rows) {
    setState({ matches: rows });
    if (state.activeTab === 'calendario-equipos') safeRender(renderPanelCalendarioEquipos, qs('.tab-panel[data-tab="calendario-equipos"]'));
    if (state.activeTab === 'inicio') safeRender(renderPanelInicio, qs('.tab-panel[data-tab="inicio"]'));
  }, function (err) { showError('Error cargando partidos: ' + err.message); });
}

function sortedMatchesList(teamFilter) {
  return state.matches
    .filter(function (m) { return !teamFilter || m.teamId === teamFilter; })
    .slice()
    .sort(function (a, b) { return (a.date + (a.time || '00:00')).localeCompare(b.date + (b.time || '00:00')); });
}

function renderPanelCalendarioEquipos(container) {
  if (!container) return;
  const teamFilter = state.calendarioEquiposTeam;
  const matches = sortedMatchesList(teamFilter);

  container.innerHTML =
    (isFirebaseUnconfigured() ? '<div class="firebase-notice rm-card" style="margin-bottom:16px">⚠ Firebase pendiente de configurar — edita js/firebase-config.js</div>' : '') +
    '<div class="rm-view-heading" style="display:flex;align-items:center;justify-content:space-between;border:0;padding:0;margin-bottom:16px;flex-wrap:wrap;gap:10px">' +
      '<div><h1 class="rm-view-title">Calendario equipos</h1><span class="rm-view-subtitle">' + matches.length + ' partidos</span></div>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
        '<select class="rm-select" id="cal-team-filter" style="min-height:36px;width:190px">' +
          '<option value="">Todos los equipos</option>' +
          TEAMS.map(function (t) { return '<option value="' + t.id + '"' + (t.id === teamFilter ? ' selected' : '') + '>' + safeText(t.name) + '</option>'; }).join('') +
        '</select>' +
        '<button class="rm-button rm-button--ghost rm-button--small" id="btn-import-matches" type="button">📋 Carga por lista</button>' +
        '<button class="rm-button rm-button--primary rm-button--small" id="btn-add-match" type="button">+ Nuevo partido</button>' +
      '</div>' +
    '</div>' +
    (matches.length
      ? '<div class="rm-table-wrap"><table class="rm-table match-list-table"><thead><tr>' +
          '<th>Fecha</th>' + (teamFilter ? '' : '<th>Equipo</th>') + '<th>Rival</th><th>L/V</th><th>Tipo</th><th>Técnicos</th>' +
        '</tr></thead><tbody>' +
          matches.map(function (m) { return renderMatchListRow(m, teamFilter); }).join('') +
        '</tbody></table></div>'
      : '<div class="rm-card"><p class="rm-card__text">No hay partidos cargados todavía.</p></div>');

  qs('#cal-team-filter', container).addEventListener('change', function (e) {
    setState({ calendarioEquiposTeam: e.target.value });
    renderPanelCalendarioEquipos(container);
  });
  qs('#btn-add-match', container).addEventListener('click', function () { openMatchModal(null); });
  qs('#btn-import-matches', container).addEventListener('click', function () { openImportModal(); });
  qsa('[data-action="edit-match"]', container).forEach(function (btn) {
    btn.addEventListener('click', function () {
      const match = state.matches.find(function (m) { return m.id === btn.dataset.id; });
      if (match) openMatchModal(match);
    });
  });
}

function renderMatchListRow(m, teamFilter) {
  const team = teamById(m.teamId);
  const techs = (m.technicianIds || [])
    .map(function (id) { const t = state.technicians.find(function (x) { return x.id === id; }); return t ? t.initials : null; })
    .filter(Boolean)
    .join(', ');
  return (
    '<tr class="match-list-row" data-action="edit-match" data-id="' + m.id + '">' +
      '<td>' + safeText(formatDate(m.date)) + (m.time ? ' ' + safeText(m.time) : '') + '</td>' +
      (teamFilter ? '' : '<td>' + safeText(team ? team.short : m.teamId) + '</td>') +
      '<td>' + safeText(m.rival || '—') + '</td>' +
      '<td>' + (m.homeAway === 'visitante' ? '@' : 'vs') + '</td>' +
      '<td>' + safeText(matchTypeLabel(m.type)) + (m.jornada ? ' J' + m.jornada : '') + '</td>' +
      '<td>' + (techs || '<em>—</em>') + '</td>' +
    '</tr>'
  );
}

function openMatchModal(match) {
  const isEdit = !!match;
  const backdrop = document.createElement('div');
  backdrop.className = 'rm-modal-backdrop';
  backdrop.innerHTML =
    '<div class="rm-modal">' +
      '<button class="rm-icon-button" id="modal-close" type="button" style="position:absolute;top:16px;right:16px">✕</button>' +
      '<h2 class="rm-modal__title">' + (isEdit ? 'Editar partido' : 'Nuevo partido') + '</h2>' +
      '<div class="rm-grid">' +
        '<div class="rm-field"><label class="rm-label">Fecha</label>' +
          '<input class="rm-input" id="m-date" type="date" value="' + (match ? match.date : todayISO()) + '" /></div>' +
        '<div class="rm-field"><label class="rm-label">Hora</label>' +
          '<input class="rm-input" id="m-time" type="time" value="' + (match ? (match.time || '') : '') + '" /></div>' +
      '</div>' +
      '<div class="rm-field"><label class="rm-label">Equipo</label>' +
        '<select class="rm-select" id="m-team">' +
          TEAMS.map(function (t) { return '<option value="' + t.id + '"' + (match && match.teamId === t.id ? ' selected' : '') + '>' + safeText(t.name) + '</option>'; }).join('') +
        '</select></div>' +
      '<div class="rm-field"><label class="rm-label">Rival</label>' +
        '<input class="rm-input" id="m-rival" type="text" value="' + safeText(match ? match.rival : '') + '" placeholder="Nombre del rival" /></div>' +
      '<div class="rm-grid">' +
        '<div class="rm-field"><label class="rm-label">Local / Visitante</label>' +
          '<select class="rm-select" id="m-homeaway">' +
            '<option value="local"' + (!match || match.homeAway === 'local' ? ' selected' : '') + '>Local</option>' +
            '<option value="visitante"' + (match && match.homeAway === 'visitante' ? ' selected' : '') + '>Visitante</option>' +
          '</select></div>' +
        '<div class="rm-field"><label class="rm-label">Tipo</label>' +
          '<select class="rm-select" id="m-type">' +
            MATCH_TYPES.map(function (t) { return '<option value="' + t.id + '"' + (match && match.type === t.id ? ' selected' : '') + '>' + safeText(t.label) + '</option>'; }).join('') +
          '</select></div>' +
      '</div>' +
      '<div class="rm-field"><label class="rm-label">Jornada (opcional)</label>' +
        '<input class="rm-input" id="m-jornada" type="number" min="1" value="' + (match && match.jornada != null ? match.jornada : '') + '" style="max-width:120px" /></div>' +
      '<div class="rm-section-title" style="margin-top:16px">Técnicos asignados</div>' +
      '<div class="rm-grid">' +
        sortedTechnicians().filter(function (t) { return t.active !== false; }).map(function (t) {
          const checked = match && (match.technicianIds || []).indexOf(t.id) !== -1;
          return '<label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--rm-text)">' +
            '<input type="checkbox" class="m-tech" value="' + t.id + '"' + (checked ? ' checked' : '') + ' /> ' + safeText(t.fullName) +
          '</label>';
        }).join('') +
      '</div>' +
      '<div class="rm-modal__actions">' +
        '<button class="rm-button rm-button--primary" id="modal-save" type="button">Guardar</button>' +
        (isEdit ? '<button class="rm-button rm-button--danger" id="modal-delete" type="button">Eliminar partido</button>' : '') +
      '</div>' +
    '</div>';
  document.body.appendChild(backdrop);

  qs('#modal-close', backdrop).addEventListener('click', function () { backdrop.remove(); });
  backdrop.addEventListener('click', function (e) { if (e.target === backdrop) backdrop.remove(); });

  function enforceTechLimit() {
    const checked = qsa('.m-tech:checked', backdrop);
    qsa('.m-tech', backdrop).forEach(function (cb) { cb.disabled = !cb.checked && checked.length >= 3; });
  }
  qsa('.m-tech', backdrop).forEach(function (cb) { cb.addEventListener('change', enforceTechLimit); });
  enforceTechLimit();

  qs('#modal-save', backdrop).addEventListener('click', function () {
    const technicianIds = qsa('.m-tech:checked', backdrop).map(function (cb) { return cb.value; });

    if (!qs('#m-date', backdrop).value) { showError('La fecha es obligatoria.'); return; }
    if (!qs('#m-team', backdrop).value) { showError('Elige un equipo.'); return; }
    if (technicianIds.length > 3) { showError('Máximo 3 técnicos por partido.'); return; }

    const data = {
      date: qs('#m-date', backdrop).value,
      time: qs('#m-time', backdrop).value || null,
      teamId: qs('#m-team', backdrop).value,
      rival: qs('#m-rival', backdrop).value.trim(),
      homeAway: qs('#m-homeaway', backdrop).value,
      type: qs('#m-type', backdrop).value,
      jornada: qs('#m-jornada', backdrop).value ? parseInt(qs('#m-jornada', backdrop).value, 10) : null,
      technicianIds: technicianIds,
    };

    const promise = match ? updateDocument('matches', match.id, data) : addDocument('matches', data);
    promise
      .then(function () { showSuccess('Partido guardado.'); backdrop.remove(); })
      .catch(function (err) { showError(err.message); });
  });

  if (isEdit) {
    qs('#modal-delete', backdrop).addEventListener('click', function () {
      if (!confirm('¿Eliminar este partido?')) return;
      deleteDocument('matches', match.id)
        .then(function () { showSuccess('Partido eliminado.'); backdrop.remove(); })
        .catch(function (err) { showError(err.message); });
    });
  }
}
