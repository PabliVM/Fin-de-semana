// ================================================
// TEAM-DAY-MATRIX.JS — Pestaña Inicio: matriz equipo × día
// Lee de state.matches (colección "matches" ya cargada por matches.js).
// Crear/editar partidos sigue haciéndose en Calendario Equipos o clicando
// aquí un partido ya existente (reutiliza openMatchModal de matches.js).
// ================================================

const MONTH_NAMES_SHORT = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

function matrixDayRange() {
  const season = seasonById(state.selectedSeasonId);
  const seasonStartYear = new Date(season.start + 'T00:00:00').getFullYear();
  const start = new Date(seasonStartYear + '-07-15T00:00:00');
  const end = new Date(season.end + 'T00:00:00');
  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(toLocalISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function matrixMonthGroups(days) {
  const groups = [];
  days.forEach(function (d) {
    const monthKey = d.slice(0, 7); // YYYY-MM
    const last = groups[groups.length - 1];
    if (last && last.key === monthKey) {
      last.count++;
    } else {
      groups.push({ key: monthKey, count: 1, label: MONTH_NAMES_SHORT[parseInt(d.slice(5, 7), 10) - 1] });
    }
  });
  return groups;
}

function matchesForCell(teamId, dayISO) {
  return state.matches.filter(function (m) { return m.teamId === teamId && m.date === dayISO; });
}

function renderPanelInicio(container) {
  if (!container) return;
  const prevWrap = qs('.matrix-wrap', container);
  const days = matrixDayRange();
  const todayIndex = days.indexOf(todayISO());
  const defaultScrollLeft = todayIndex > -1 ? Math.max(0, todayIndex * 70 - 300) : 0;
  const scrollLeft = prevWrap ? prevWrap.scrollLeft : defaultScrollLeft;
  const scrollTop = prevWrap ? prevWrap.scrollTop : 0;

  const monthGroups = matrixMonthGroups(days);
  const techs = state.technicians;

  container.innerHTML =
    (isFirebaseUnconfigured() ? '<div class="firebase-notice rm-card" style="margin-bottom:16px">⚠ Firebase pendiente de configurar — edita js/firebase-config.js</div>' : '') +
    '<div class="rm-view-heading" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;border:0;padding:0;margin-bottom:16px">' +
      '<div><h1 class="rm-view-title">Calendario general de equipos</h1>' +
        '<span class="rm-view-subtitle">Los partidos se crean en "Calendario equipos" — aquí solo se consultan y editan</span></div>' +
      '<div class="match-type-legend">' +
        '<span class="match-type-legend__item"><span class="match-type-legend__dot match-type-legend__dot--liga"></span>Liga</span>' +
        '<span class="match-type-legend__item"><span class="match-type-legend__dot match-type-legend__dot--amistoso"></span>Amistoso</span>' +
        '<span class="match-type-legend__item"><span class="match-type-legend__dot match-type-legend__dot--torneo"></span>Torneo</span>' +
        '<span class="match-type-legend__item"><span class="match-type-legend__dot match-type-legend__dot--liga-postponed"></span>Liga aplazada</span>' +
      '</div>' +
    '</div>' +
    '<div class="rm-table-wrap matrix-wrap"><table class="rm-table matrix-table">' +
      '<colgroup><col class="matrix-col-team" />' + days.map(function () { return '<col class="matrix-col-day" />'; }).join('') + '</colgroup>' +
      '<thead>' +
        '<tr>' +
          '<th rowspan="2" class="matrix-corner">Equipo</th>' +
          monthGroups.map(function (g) { return '<th colspan="' + g.count + '" class="matrix-month">' + g.label + '</th>'; }).join('') +
        '</tr>' +
        '<tr>' +
          days.map(function (d) { return '<th class="matrix-day' + (isWeekendDay(d) ? ' matrix-day--weekend' : '') + weekendEdgeClass(d) + '">' + d.slice(8, 10) + '</th>'; }).join('') +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        TEAMS.map(function (team) { return renderMatrixRow(team, days); }).join('') +
      '</tbody>' +
    '</table></div>';

  const newWrap = qs('.matrix-wrap', container);
  if (newWrap) { newWrap.scrollLeft = scrollLeft; newWrap.scrollTop = scrollTop; }

  qsa('.match-tech-grid', container).forEach(function (grid) {
    grid.addEventListener('click', function () {
      const match = state.matches.find(function (m) { return m.id === grid.dataset.matchId; });
      if (match) openMatchModal(match);
    });
  });

  qsa('.matrix-tech-add', container).forEach(function (select) {
    select.addEventListener('change', function () {
      const technicianId = select.value;
      if (!technicianId) return;
      const match = state.matches.find(function (m) { return m.id === select.dataset.matchId; });
      if (!match) return;
      const updated = (match.technicianIds || []).concat([technicianId]);
      updateDocument('matches', match.id, { technicianIds: updated })
        .then(function () { showSuccess('Técnico añadido.'); })
        .catch(function (err) { showError(err.message); });
    });
  });
}

function isWeekendDay(dayISO) {
  const dow = new Date(dayISO + 'T00:00:00').getDay();
  return dow === 0 || dow === 6;
}

function weekendEdgeClass(dayISO) {
  const dow = new Date(dayISO + 'T00:00:00').getDay();
  if (dow === 6) return ' matrix-edge-start';
  if (dow === 0) return ' matrix-edge-end';
  return '';
}

function renderMatrixRow(team, days) {
  return (
    '<tr>' +
      '<td class="matrix-team">' + safeText(team.name) + '</td>' +
      days.map(function (d) { return renderMatrixCell(team.id, d); }).join('') +
    '</tr>'
  );
}

function renderMatrixCell(teamId, dayISO) {
  const matches = matchesForCell(teamId, dayISO);
  const cls = 'matrix-cell' + (isWeekendDay(dayISO) ? ' matrix-cell--weekend' : '') + weekendEdgeClass(dayISO);
  if (!matches.length) return '<td class="' + cls + '"></td>';

  const blocks = matches.map(function (m) {
    const initials = (m.technicianIds || [])
      .map(function (id) { const t = state.technicians.find(function (x) { return x.id === id; }); return t ? t.initials : '?'; });
    const techsText = initials.join(', ');
    const gridType = (m.postponed && m.type === 'liga') ? 'liga-postponed' : (m.type || 'liga');
    const title = (m.time || '') + ' ' + (m.homeAway === 'visitante' ? '@' : 'vs') + ' ' + (m.rival || '?') +
      ' [' + matchTypeLabel(m.type) + (m.jornada ? ' J' + m.jornada : '') + (m.postponed ? ' · APLAZADO' : '') + ']' + (techsText ? ' — Técnicos: ' + techsText : ' — sin técnico');
    const cells = initials.length
      ? initials.map(function (i) { return '<span class="match-tech-cell">' + safeText(i) + '</span>'; }).join('')
      : '<span class="match-tech-cell match-tech-cell--empty">·</span>';
    const grid = '<div class="match-tech-grid match-tech-grid--' + safeText(gridType) + '" data-match-id="' + m.id + '" title="' + safeText(title) + '">' + cells + '</div>';
    const addSelect = renderMatrixTechAdd(m);
    return '<div class="matrix-match-block">' + grid + addSelect + '</div>';
  }).join('');

  return '<td class="' + cls + '"><div class="matrix-cell__dots">' + blocks + '</div></td>';
}

function renderMatrixTechAdd(m) {
  const assigned = m.technicianIds || [];
  if (assigned.length >= 4) return '';
  const available = state.technicians.filter(function (t) { return t.active !== false && assigned.indexOf(t.id) === -1; });
  if (!available.length) return '';
  return (
    '<select class="matrix-tech-add" data-match-id="' + m.id + '" title="Añadir técnico">' +
      '<option value="">+</option>' +
      available.map(function (t) {
        const off = isTechOffOnDate(t.id, m.date);
        return '<option value="' + t.id + '"' + (off ? ' disabled' : '') + '>' + safeText(t.initials) + (off ? ' (libra)' : '') + '</option>';
      }).join('') +
    '</select>'
  );
}
