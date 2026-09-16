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

function sortedMatchesList(teamIds, type) {
  return state.matches
    .filter(function (m) { return !teamIds.length || teamIds.indexOf(m.teamId) !== -1; })
    .filter(function (m) { return !type || m.type === type; })
    .slice()
    .sort(function (a, b) { return (a.date + (a.time || '00:00')).localeCompare(b.date + (b.time || '00:00')); });
}

function toggleCalendarioTeam(teamId) {
  const current = state.calendarioEquiposTeams.slice();
  if (teamId === '') { setState({ calendarioEquiposTeams: [] }); return; }
  const idx = current.indexOf(teamId);
  if (idx === -1) current.push(teamId); else current.splice(idx, 1);
  setState({ calendarioEquiposTeams: current });
}

function renderPanelCalendarioEquipos(container) {
  if (!container) return;
  const teamIds = state.calendarioEquiposTeams;
  const type = state.calendarioEquiposType;
  const matches = sortedMatchesList(teamIds, type);
  const showTeamCol = teamIds.length !== 1;

  container.innerHTML =
    (isFirebaseUnconfigured() ? '<div class="firebase-notice rm-card" style="margin-bottom:16px">⚠ Firebase pendiente de configurar — edita js/firebase-config.js</div>' : '') +
    '<div class="rm-view-heading" style="display:flex;align-items:center;justify-content:space-between;border:0;padding:0;margin-bottom:12px;flex-wrap:wrap;gap:10px">' +
      '<div><h1 class="rm-view-title">Calendario equipos</h1><span class="rm-view-subtitle">' + matches.length + ' partidos</span></div>' +
      '<div style="display:flex;gap:8px">' +
        '<button class="rm-button rm-button--ghost rm-button--small" id="btn-import-matches" type="button">📋 Carga por lista</button>' +
        '<button class="rm-button rm-button--primary rm-button--small" id="btn-add-match" type="button">+ Nuevo partido</button>' +
      '</div>' +
    '</div>' +
    '<div class="team-tabs">' +
      '<button class="rm-pill-button' + (!teamIds.length ? ' is-active' : '') + '" data-team="">Todos</button>' +
      TEAMS.map(function (t) { return '<button class="rm-pill-button' + (teamIds.indexOf(t.id) !== -1 ? ' is-active' : '') + '" data-team="' + t.id + '">' + safeText(t.short) + '</button>'; }).join('') +
    '</div>' +
    '<div class="team-tabs" style="margin-bottom:16px">' +
      '<button class="rm-pill-button' + (!type ? ' is-active' : '') + '" data-type="">Todos</button>' +
      MATCH_TYPES.map(function (t) { return '<button class="rm-pill-button' + (type === t.id ? ' is-active' : '') + '" data-type="' + t.id + '">' + safeText(t.label) + '</button>'; }).join('') +
    '</div>' +
    (matches.length
      ? '<div class="rm-table-wrap"><table class="rm-table match-list-table"><thead><tr>' +
          '<th>Fecha</th>' + (showTeamCol ? '<th>Equipo</th>' : '') + '<th>Rival</th><th>L/V</th><th>Tipo</th><th>Técnicos</th><th></th>' +
        '</tr></thead><tbody>' +
          matches.map(function (m) { return renderMatchListRow(m, showTeamCol); }).join('') +
        '</tbody></table></div>'
      : '<div class="rm-card"><p class="rm-card__text">No hay partidos con este filtro.</p></div>');

  qsa('.team-tabs [data-team]', container).forEach(function (btn) {
    btn.addEventListener('click', function () { toggleCalendarioTeam(btn.dataset.team); renderPanelCalendarioEquipos(container); });
  });
  qsa('.team-tabs [data-type]', container).forEach(function (btn) {
    btn.addEventListener('click', function () { setState({ calendarioEquiposType: btn.dataset.type }); renderPanelCalendarioEquipos(container); });
  });
  qs('#btn-add-match', container).addEventListener('click', function () { openMatchModal(null); });
  qs('#btn-import-matches', container).addEventListener('click', function () { openImportModal(); });
  qsa('[data-action="edit-match"]', container).forEach(function (btn) {
    btn.addEventListener('click', function () {
      const match = state.matches.find(function (m) { return m.id === btn.dataset.id; });
      if (match) openMatchModal(match);
    });
  });
  qsa('[data-action="delete-match"]', container).forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!confirm('¿Eliminar este partido?')) return;
      deleteDocument('matches', btn.dataset.id).catch(function (err) { showError(err.message); });
    });
  });
}

function renderMatchListRow(m, showTeamCol) {
  const team = teamById(m.teamId);
  const techs = (m.technicianIds || [])
    .map(function (id) { const t = state.technicians.find(function (x) { return x.id === id; }); return t ? t.initials : null; })
    .filter(Boolean)
    .join(', ');
  return (
    '<tr class="match-list-row">' +
      '<td data-action="edit-match" data-id="' + m.id + '">' + safeText(formatDate(m.date)) + (m.time ? ' ' + safeText(m.time) : '') + '</td>' +
      (showTeamCol ? '<td data-action="edit-match" data-id="' + m.id + '">' + safeText(team ? team.short : m.teamId) + '</td>' : '') +
      '<td data-action="edit-match" data-id="' + m.id + '">' + safeText(m.rival || '—') + '</td>' +
      '<td class="match-list-lv" data-action="edit-match" data-id="' + m.id + '">' + (m.homeAway === 'visitante' ? 'V' : 'L') + '</td>' +
      '<td data-action="edit-match" data-id="' + m.id + '"><span class="match-type-chip match-type-chip--' + safeText(m.postponed && m.type === 'liga' ? 'liga-postponed' : (m.type || 'liga')) + '">' + safeText(matchTypeLabel(m.type)) + (m.jornada ? ' J' + m.jornada : '') + (m.postponed ? ' ⏱' : '') + '</span></td>' +
      '<td data-action="edit-match" data-id="' + m.id + '">' + (techs || '<em>—</em>') + '</td>' +
      '<td class="match-list-row__actions">' +
        '<button class="rm-icon-button" data-action="edit-match" data-id="' + m.id + '" title="Editar">✏️</button>' +
        '<button class="rm-icon-button" data-action="delete-match" data-id="' + m.id + '" title="Eliminar">✕</button>' +
      '</td>' +
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
          TEAMS.map(function (t) { return '<option value="' + t.id + '"' + (match && match.teamId === t.id ? ' selected' : '') + '>' + safeText(t.short) + '</option>'; }).join('') +
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
    qsa('.m-tech', backdrop).forEach(function (cb) { cb.disabled = !cb.checked && checked.length >= 4; });
  }
  qsa('.m-tech', backdrop).forEach(function (cb) { cb.addEventListener('change', enforceTechLimit); });
  enforceTechLimit();

  qs('#modal-save', backdrop).addEventListener('click', function () {
    const technicianIds = qsa('.m-tech:checked', backdrop).map(function (cb) { return cb.value; });
    const newDate = qs('#m-date', backdrop).value;
    const newType = qs('#m-type', backdrop).value;

    if (!newDate) { showError('La fecha es obligatoria.'); return; }
    if (!qs('#m-team', backdrop).value) { showError('Elige un equipo.'); return; }
    if (technicianIds.length > 4) { showError('Máximo 4 técnicos por partido.'); return; }

    let postponed = match ? !!match.postponed : false;
    if (match && match.date !== newDate) {
      const diffDays = Math.abs((new Date(newDate + 'T00:00:00') - new Date(match.date + 'T00:00:00')) / 86400000);
      if (diffDays > 1 && newType === 'liga') {
        postponed = confirm('El partido cambia de fecha más de un día. ¿Es un aplazamiento?');
      }
    }

    const data = {
      date: newDate,
      time: qs('#m-time', backdrop).value || null,
      teamId: qs('#m-team', backdrop).value,
      rival: qs('#m-rival', backdrop).value.trim(),
      homeAway: qs('#m-homeaway', backdrop).value,
      type: newType,
      jornada: qs('#m-jornada', backdrop).value ? parseInt(qs('#m-jornada', backdrop).value, 10) : null,
      technicianIds: technicianIds,
      postponed: postponed,
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
