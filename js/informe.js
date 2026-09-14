// ================================================
// INFORME.JS — Pestaña Informe general
// "Calendario general": técnicos (filas) × findes del mes (columnas) → equipos visionados
// "Ficha individual": pendiente (siguiente módulo)
// ================================================

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function weekendsInMonth(year, month) {
  const result = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() === 0) result.push(toLocalISO(d));
    d.setDate(d.getDate() + 1);
  }
  return result;
}

function ensureInformeMonth() {
  if (!state.informeMonth) {
    const ref = new Date(nextWeekendDate() + 'T00:00:00');
    setState({ informeMonth: { year: ref.getFullYear(), month: ref.getMonth() } });
  }
}

function shiftInformeMonth(delta) {
  ensureInformeMonth();
  let { year, month } = state.informeMonth;
  month += delta;
  if (month < 0) { month = 11; year -= 1; }
  if (month > 11) { month = 0; year += 1; }
  setState({ informeMonth: { year: year, month: month } });
  safeRender(renderPanelInforme, qs('.tab-panel[data-tab="informe"]'));
}

function renderPanelInforme(container) {
  if (!container) return;
  ensureInformeMonth();

  container.innerHTML =
    '<div class="rm-view-heading" style="border:0;padding:0;margin-bottom:16px">' +
      '<h1 class="rm-view-title">Informe general</h1>' +
    '</div>' +
    '<div class="informe-subtabs">' +
      '<button class="rm-pill-button' + (state.informeView === 'calendario' ? ' is-active' : '') + '" data-view="calendario" type="button">Calendario general</button>' +
      '<button class="rm-pill-button' + (state.informeView === 'ficha' ? ' is-active' : '') + '" data-view="ficha" type="button">Ficha individual</button>' +
      '<button class="rm-pill-button" id="btn-team-dates" type="button">📅 Fechas de inicio de equipos</button>' +
    '</div>' +
    '<div id="informe-body" style="margin-top:16px"></div>';

  qs('#btn-team-dates', container).addEventListener('click', function () { openTeamDatesModal(); });

  qsa('[data-view]', container).forEach(function (btn) {
    btn.addEventListener('click', function () {
      setState({ informeView: btn.dataset.view });
      renderPanelInforme(container);
    });
  });

  const body = qs('#informe-body', container);
  if (state.informeView === 'ficha') {
    body.innerHTML = '<div class="rm-card"><p class="rm-card__text">Ficha individual — siguiente módulo.</p></div>';
    return;
  }
  renderCalendarioGeneral(body);
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function renderCalendarioGeneral(body) {
  const { year, month } = state.informeMonth;
  const totalDays = daysInMonth(year, month);
  const techs = sortedTechnicians().filter(function (t) { return t.active !== false; });

  const days = [];
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    days.push({ day: d, dow: date.getDay(), iso: toLocalISO(date) });
  }

  body.innerHTML =
    '<div class="informe-month-nav">' +
      '<button class="rm-icon-button" id="informe-prev" type="button">‹</button>' +
      '<span class="informe-month-label">' + MONTH_NAMES[month] + ' ' + year + '</span>' +
      '<button class="rm-icon-button" id="informe-next" type="button">›</button>' +
    '</div>' +
    (techs.length
      ? '<div class="rm-table-wrap"><table class="rm-table calendario-table"><thead><tr>' +
          '<th>Técnico</th>' +
          days.map(function (d) { return '<th class="' + (isWeekendDow(d.dow) ? 'weekend-col' : '') + '">' + String(d.day).padStart(2, '0') + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
          techs.map(function (t) { return renderInformeRow(t, days); }).join('') +
        '</tbody></table></div>'
      : '<div class="rm-card"><p class="rm-card__text">No hay técnicos activos.</p></div>');

  qs('#informe-prev', body).addEventListener('click', function () { shiftInformeMonth(-1); });
  qs('#informe-next', body).addEventListener('click', function () { shiftInformeMonth(1); });
}

function isWeekendDow(dow) {
  return dow === 0 || dow === 6;
}

function renderInformeRow(t, days) {
  return (
    '<tr>' +
      '<td>' + safeText(t.initials) + '</td>' +
      days.map(function (d) {
        const cls = isWeekendDow(d.dow) ? 'weekend-col' : '';
        const content = d.dow === 0 ? renderInformeCell(t.id, d.iso) : '';
        return '<td class="' + cls + '">' + content + '</td>';
      }).join('') +
    '</tr>'
  );
}

function renderInformeCell(technicianId, weekendDate) {
  const s = sightingFor(technicianId, weekendDate);
  if (!s) return '';
  const chips = [s.team1, s.team2]
    .filter(Boolean)
    .map(function (teamId) { const team = teamById(teamId); return '<span class="rm-chip">' + safeText(team ? team.short : teamId) + '</span>'; });
  return chips.length ? '<div class="informe-cell">' + chips.join('') + '</div>' : '';
}
