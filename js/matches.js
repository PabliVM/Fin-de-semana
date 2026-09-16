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
  }, function (err) { showError('Error cargando partidos: ' + err.message); });
}

function matchesByDay() {
  const byDay = {};
  state.matches.forEach(function (m) {
    if (!byDay[m.date]) byDay[m.date] = [];
    byDay[m.date].push(m);
  });
  return Object.keys(byDay).sort().map(function (date) {
    return { date: date, matches: byDay[date].sort(function (a, b) { return (a.time || '').localeCompare(b.time || ''); }) };
  });
}

function renderPanelCalendarioEquipos(container) {
  if (!container) return;
  const days = matchesByDay();

  container.innerHTML =
    (isFirebaseUnconfigured() ? '<div class="firebase-notice rm-card" style="margin-bottom:16px">⚠ Firebase pendiente de configurar — edita js/firebase-config.js</div>' : '') +
    '<div class="rm-view-heading" style="display:flex;align-items:center;justify-content:space-between;border:0;padding:0;margin-bottom:16px">' +
      '<div><h1 class="rm-view-title">Calendario equipos</h1><span class="rm-view-subtitle">' + state.matches.length + ' partidos</span></div>' +
      '<button class="rm-button rm-button--primary rm-button--small" id="btn-add-match" type="button">+ Nuevo partido</button>' +
    '</div>' +
    (days.length
      ? days.map(renderMatchDayGroup).join('')
      : '<div class="rm-card"><p class="rm-card__text">No hay partidos cargados todavía.</p></div>');

  qs('#btn-add-match', container).addEventListener('click', function () { openMatchModal(null); });
  qsa('[data-action="edit-match"]', container).forEach(function (btn) {
    btn.addEventListener('click', function () {
      const match = state.matches.find(function (m) { return m.id === btn.dataset.id; });
      if (match) openMatchModal(match);
    });
  });
}

function renderMatchDayGroup(day) {
  return (
    '<div class="match-day">' +
      '<div class="match-day__label">' + safeText(formatDate(day.date)) + '</div>' +
      '<div class="match-day__cards">' +
        day.matches.map(renderMatchCard).join('') +
      '</div>' +
    '</div>'
  );
}

function renderMatchCard(m) {
  const team = teamById(m.teamId);
  const techs = (m.technicianIds || [])
    .map(function (id) { const t = state.technicians.find(function (x) { return x.id === id; }); return t ? t.initials + ' — ' + t.fullName : null; })
    .filter(Boolean)
    .join(', ');
  return (
    '<div class="rm-card match-card" data-action="edit-match" data-id="' + m.id + '">' +
      '<div class="match-card__top">' +
        '<span class="rm-badge rm-badge--info">' + safeText(matchTypeLabel(m.type)) + '</span>' +
        (m.time ? '<span class="match-card__time">' + safeText(m.time) + '</span>' : '') +
      '</div>' +
      '<div class="match-card__teams">' + safeText(team ? team.name : m.teamId) + ' <span class="match-card__vs">' + (m.homeAway === 'visitante' ? '@' : 'vs') + '</span> ' + safeText(m.rival || '—') + '</div>' +
      '<div class="match-card__tech">' + (techs ? 'Técnicos: ' + safeText(techs) : 'Sin técnico asignado') + '</div>' +
    '</div>'
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

  qs('#modal-save', backdrop).addEventListener('click', function () {
    const data = {
      date: qs('#m-date', backdrop).value,
      time: qs('#m-time', backdrop).value || null,
      teamId: qs('#m-team', backdrop).value,
      rival: qs('#m-rival', backdrop).value.trim(),
      homeAway: qs('#m-homeaway', backdrop).value,
      type: qs('#m-type', backdrop).value,
      technicianIds: qsa('.m-tech:checked', backdrop).map(function (cb) { return cb.value; }),
    };
    if (!data.date) { showError('La fecha es obligatoria.'); return; }
    if (!data.teamId) { showError('Elige un equipo.'); return; }

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
