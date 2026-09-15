// ================================================
// TECHNICIANS.JS — CRUD técnicos + asignaciones históricas
// Colecciones Firestore:
//   technicians          { fullName, initials, startDate, endDate, active, order }
//   technicianAssignments{ technicianId, teamId, startDate, endDate }
// ================================================

let _unsubTech = null;
let _unsubAssign = null;

function initTechniciansData() {
  if (!isFirebaseUnconfigured()) {
    _unsubTech = listenCollection('technicians', function (rows) {
      setState({ technicians: rows, loaded: Object.assign({}, state.loaded, { technicians: true }) });
      if (state.activeTab === 'tecnicos') safeRender(renderPanelTecnicos, qs('.tab-panel[data-tab="tecnicos"]'));
      if (state.activeTab === 'inicio') safeRender(renderPanelInicio, qs('.tab-panel[data-tab="inicio"]'));
      if (state.activeTab === 'informe') safeRender(renderPanelInforme, qs('.tab-panel[data-tab="informe"]'));
      if (state.activeTab === 'viernes') safeRender(renderPanelViernes, qs('.tab-panel[data-tab="viernes"]'));
    }, function (err) { showError('Error cargando técnicos: ' + err.message); });

    _unsubAssign = listenCollection('technicianAssignments', function (rows) {
      setState({ assignments: rows, loaded: Object.assign({}, state.loaded, { assignments: true }) });
      if (state.activeTab === 'tecnicos') safeRender(renderPanelTecnicos, qs('.tab-panel[data-tab="tecnicos"]'));
      if (state.activeTab === 'informe') safeRender(renderPanelInforme, qs('.tab-panel[data-tab="informe"]'));
    }, function (err) { showError('Error cargando asignaciones: ' + err.message); });
  }
}

function currentAssignmentsFor(technicianId) {
  const today = todayISO();
  return state.assignments.filter(function (a) {
    return a.technicianId === technicianId && (!a.endDate || a.endDate >= today);
  });
}

function historyAssignmentsFor(technicianId) {
  return state.assignments
    .filter(function (a) { return a.technicianId === technicianId; })
    .sort(function (a, b) { return (b.startDate || '').localeCompare(a.startDate || ''); });
}

// ── RENDER LISTA ──────────────────────────────────

function sortedTechnicians() {
  return state.technicians.slice().sort(function (a, b) {
    return (a.order || 0) - (b.order || 0) || (a.fullName || '').localeCompare(b.fullName || '');
  });
}

function renderPanelTecnicos(container) {
  if (!container) return;
  const sorted = sortedTechnicians();

  container.innerHTML =
    (isFirebaseUnconfigured() ? '<div class="firebase-notice rm-card" style="margin-bottom:16px">⚠ Firebase pendiente de configurar — edita js/firebase-config.js</div>' : '') +
    '<div class="rm-view-heading" style="display:flex;align-items:center;justify-content:space-between;border:0;padding:0;margin-bottom:16px">' +
      '<div><h1 class="rm-view-title">Técnicos</h1><span class="rm-view-subtitle">' + sorted.length + ' registrados</span></div>' +
      '<button class="rm-button rm-button--primary rm-button--small" id="btn-add-tech" type="button">+ Nuevo técnico</button>' +
    '</div>' +
    '<div class="tech-list" id="tech-list"></div>';

  const list = qs('#tech-list', container);
  if (!sorted.length) {
    list.innerHTML = '<div class="rm-card"><p class="rm-card__text">No hay técnicos todavía.</p></div>';
  } else {
    sorted.forEach(function (t, i) { list.appendChild(renderTechRow(t, i === 0, i === sorted.length - 1)); });
  }

  qs('#btn-add-tech', container).addEventListener('click', function () { openTechModal(null); });
}

function renderTechRow(t, isFirst, isLast) {
  const row = document.createElement('div');
  row.className = 'tech-row' + (t.active === false ? ' is-inactive' : '');
  const teams = currentAssignmentsFor(t.id)
    .slice()
    .sort(function (a, b) { return teamOrderIndex(a.teamId) - teamOrderIndex(b.teamId); })
    .map(function (a) { const team = teamById(a.teamId); return team ? team.name : a.teamId; })
    .join(' · ') || 'Sin equipos asignados';

  row.innerHTML =
    '<div class="tech-row__order">' +
      '<button class="rm-icon-button" data-action="move-up" type="button"' + (isFirst ? ' disabled' : '') + '>▲</button>' +
      '<button class="rm-icon-button" data-action="move-down" type="button"' + (isLast ? ' disabled' : '') + '>▼</button>' +
    '</div>' +
    '<div class="tech-row__avatar">' + safeText(t.initials || '??') + '</div>' +
    '<div class="tech-row__main">' +
      '<div class="tech-row__name">' + safeText(t.fullName) + (t.active === false ? ' <span class="rm-badge rm-badge--danger">Baja</span>' : '') + '</div>' +
      '<div class="tech-row__teams">' + safeText(teams) + '</div>' +
    '</div>' +
    '<div class="tech-row__actions">' +
      '<button class="rm-button rm-button--ghost rm-button--small" data-action="edit">Ficha</button>' +
    '</div>';

  qs('[data-action="edit"]', row).addEventListener('click', function () { openTechModal(t); });
  qs('[data-action="move-up"]', row).addEventListener('click', function () { moveTechnician(t.id, -1); });
  qs('[data-action="move-down"]', row).addEventListener('click', function () { moveTechnician(t.id, 1); });
  return row;
}

function moveTechnician(technicianId, direction) {
  const sorted = sortedTechnicians();
  const idx = sorted.findIndex(function (t) { return t.id === technicianId; });
  const targetIdx = idx + direction;
  if (idx === -1 || targetIdx < 0 || targetIdx >= sorted.length) return;

  const reordered = sorted.slice();
  const tmp = reordered[idx];
  reordered[idx] = reordered[targetIdx];
  reordered[targetIdx] = tmp;

  Promise.all(reordered.map(function (t, i) { return updateDocument('technicians', t.id, { order: i }); }))
    .catch(function (err) { showError(err.message); });
}

// ── MODAL FICHA TÉCNICO ───────────────────────────

function openTechModal(technician) {
  const isEdit = !!technician;
  const backdrop = document.createElement('div');
  backdrop.className = 'rm-modal-backdrop';
  backdrop.innerHTML =
    '<div class="rm-modal">' +
      '<button class="rm-icon-button" id="modal-close" type="button" style="position:absolute;top:16px;right:16px">✕</button>' +
      '<h2 class="rm-modal__title">' + (isEdit ? 'Editar técnico' : 'Nuevo técnico') + '</h2>' +
      '<div class="rm-field"><label class="rm-label">Nombre completo</label>' +
        '<input class="rm-input" id="f-name" value="' + safeText(technician ? technician.fullName : '') + '" placeholder="Nombre y apellidos" /></div>' +
      '<div class="rm-field"><label class="rm-label">Iniciales</label>' +
        '<input class="rm-input" id="f-initials" maxlength="4" value="' + safeText(technician ? technician.initials : '') + '" placeholder="JG" /></div>' +
      '<div class="rm-grid">' +
        '<div class="rm-field"><label class="rm-label">Fecha de alta</label>' +
          '<input class="rm-input" id="f-start" type="date" value="' + (technician ? (technician.startDate || '') : todayISO()) + '" /></div>' +
        '<div class="rm-field"><label class="rm-label">Fecha de baja</label>' +
          '<input class="rm-input" id="f-end" type="date" value="' + (technician ? (technician.endDate || '') : '') + '" /></div>' +
      '</div>' +
      (isEdit ? renderAssignmentsBlock(technician) : renderNewTechTeamsBlock()) +
      '<div class="rm-modal__actions">' +
        '<button class="rm-button rm-button--primary" id="modal-save" type="button">Guardar</button>' +
        (isEdit ? '<button class="rm-button rm-button--danger" id="modal-delete" type="button">Eliminar técnico</button>' : '') +
      '</div>' +
    '</div>';
  document.body.appendChild(backdrop);

  qs('#modal-close', backdrop).addEventListener('click', function () { backdrop.remove(); });
  backdrop.addEventListener('click', function (e) { if (e.target === backdrop) backdrop.remove(); });

  qs('#modal-save', backdrop).addEventListener('click', function () {
    saveTechnicianFromModal(backdrop, technician);
  });

  if (isEdit) {
    qs('#modal-delete', backdrop).addEventListener('click', function () {
      if (!confirm('¿Eliminar a ' + technician.fullName + '? Esto no borra sus asignaciones históricas.')) return;
      deleteDocument('technicians', technician.id)
        .then(function () { showSuccess('Técnico eliminado.'); backdrop.remove(); })
        .catch(function (err) { showError(err.message); });
    });
    bindAssignmentEvents(backdrop, technician);
  }
}

function renderNewTechTeamsBlock() {
  return (
    '<div class="rm-section-title" style="margin-top:20px">Equipos asignados (opcional)</div>' +
    '<p class="rm-card__text" style="margin-bottom:8px">No hace falta rellenarlo ahora, pero ayuda para el % de visionados por equipo.</p>' +
    '<div class="rm-grid">' +
      TEAMS.map(function (t) {
        return '<label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--rm-text)">' +
          '<input type="checkbox" class="f-new-team" value="' + t.id + '" /> ' + safeText(t.name) +
        '</label>';
      }).join('') +
    '</div>'
  );
}

function saveTechnicianFromModal(backdrop, technician) {
  const fullName = qs('#f-name', backdrop).value.trim();
  const initials = qs('#f-initials', backdrop).value.trim().toUpperCase();
  const startDate = qs('#f-start', backdrop).value || todayISO();
  const endDate = qs('#f-end', backdrop).value || null;

  if (!fullName) { showError('El nombre es obligatorio.'); return; }
  if (!initials) { showError('Las iniciales son obligatorias.'); return; }

  const data = {
    fullName: fullName,
    initials: initials,
    startDate: startDate,
    endDate: endDate,
    active: !endDate,
  };
  if (!technician) data.order = state.technicians.length; // nuevo técnico va al final

  const promise = technician
    ? updateDocument('technicians', technician.id, data)
    : addDocument('technicians', data).then(function (newId) {
        const checked = qsa('.f-new-team:checked', backdrop).map(function (cb) { return cb.value; });
        return Promise.all(checked.map(function (teamId) {
          return addDocument('technicianAssignments', {
            technicianId: newId, teamId: teamId, startDate: startDate, endDate: null,
          });
        }));
      });

  promise
    .then(function () { showSuccess('Técnico guardado.'); backdrop.remove(); })
    .catch(function (err) { showError(err.message); });
}

// ── EQUIPOS ASIGNADOS (histórico) ─────────────────

function renderAssignmentsBlock(technician) {
  const current = currentAssignmentsFor(technician.id);
  const currentIds = current.map(function (a) { return a.teamId; });
  const availableTeams = TEAMS.filter(function (t) { return currentIds.indexOf(t.id) === -1; });
  const history = historyAssignmentsFor(technician.id);

  return (
    '<div class="rm-section-title" style="margin-top:20px">Equipos asignados</div>' +
    '<div class="rm-field" style="display:flex;gap:8px;align-items:flex-end">' +
      '<div style="flex:1"><label class="rm-label">Añadir equipo</label>' +
        '<select class="rm-select" id="f-assign-team">' +
          (availableTeams.length ? availableTeams.map(function (t) { return '<option value="' + t.id + '">' + safeText(t.name) + '</option>'; }).join('') : '<option value="">Sin equipos disponibles</option>') +
        '</select></div>' +
      '<div><label class="rm-label">Desde</label>' +
        '<input class="rm-input" id="f-assign-start" type="date" value="' + todayISO() + '" style="width:150px" /></div>' +
      '<button class="rm-button rm-button--gold rm-button--small" id="btn-assign-add" type="button"' + (availableTeams.length ? '' : ' disabled') + '>Añadir</button>' +
    '</div>' +
    '<div class="assign-list" id="assign-list">' +
      (history.length ? history.map(renderAssignRow).join('') : '<p class="rm-card__text">Sin asignaciones registradas.</p>') +
    '</div>'
  );
}

function renderAssignRow(a) {
  const team = teamById(a.teamId);
  const closed = !!a.endDate;
  return (
    '<div class="assign-row' + (closed ? ' is-closed' : '') + '" data-assign-id="' + a.id + '">' +
      '<span class="assign-row__team">' + safeText(team ? team.name : a.teamId) + '</span>' +
      '<span class="assign-row__dates">' + formatDate(a.startDate) + ' → ' + (a.endDate ? formatDate(a.endDate) : 'actual') + '</span>' +
      (closed ? '' : '<button class="rm-button rm-button--ghost rm-button--small" data-action="end-assign">Finalizar</button>') +
    '</div>'
  );
}

function bindAssignmentEvents(backdrop, technician) {
  const btnAdd = qs('#btn-assign-add', backdrop);
  if (btnAdd) {
    btnAdd.addEventListener('click', function () {
      const teamId = qs('#f-assign-team', backdrop).value;
      const startDate = qs('#f-assign-start', backdrop).value || todayISO();
      if (!teamId) { showError('Selecciona un equipo.'); return; }
      addDocument('technicianAssignments', { technicianId: technician.id, teamId: teamId, startDate: startDate, endDate: null })
        .then(function () {
          showSuccess('Equipo asignado.');
          backdrop.remove();
          openTechModal(technician); // reabrir con datos frescos tras el onSnapshot
        })
        .catch(function (err) { showError(err.message); });
    });
  }

  qsa('[data-action="end-assign"]', backdrop).forEach(function (btn) {
    btn.addEventListener('click', function () {
      const assignId = btn.closest('.assign-row').dataset.assignId;
      updateDocument('technicianAssignments', assignId, { endDate: todayISO() })
        .then(function () {
          showSuccess('Asignación finalizada.');
          backdrop.remove();
          openTechModal(technician);
        })
        .catch(function (err) { showError(err.message); });
    });
  });
}
