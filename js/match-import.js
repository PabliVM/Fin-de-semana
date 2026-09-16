// ================================================
// MATCH-IMPORT.JS — Carga por lista en Calendario Equipos
// Formato esperado por línea, separado por "|":
//   Fecha | Día | Rival | Local/Visitante | Tipo | Hora
//   20/09/2026 | Domingo | Albacete | Visitante | Liga | 18:00
// Hora y Tipo son opcionales (Tipo por defecto: Liga). El resto, si no se
// reconoce con seguridad, se marca para revisión — nunca se inventa.
// ================================================

// ================================================
// MATCH-IMPORT.JS — Carga por lista en Calendario Equipos
// Formato esperado por línea, separado por "|":
//   Fecha | Rival | Local/Visitante | Jornada
//   26/09/2026 | C.F. Fuenlabrada S.A.D. Cadete A | LOCAL | Jor. 1
// Si hay número de jornada, se asume Liga automáticamente. Lo que no se
// reconozca con seguridad se marca para revisión — nunca se inventa.
// ================================================

function normalizeAccents(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseMatchLine(line) {
  const parts = line.split('|').map(function (p) { return p.trim(); });
  const [fechaRaw, rivalRaw, localVisRaw, jornadaRaw] = parts;
  const issues = [];

  let date = '';
  if (fechaRaw) {
    const m = fechaRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const dd = m[1].padStart(2, '0'), mm = m[2].padStart(2, '0'), yyyy = m[3];
      const candidate = yyyy + '-' + mm + '-' + dd;
      const d = new Date(candidate + 'T00:00:00');
      if (!isNaN(d.getTime()) && d.getDate() === parseInt(dd, 10)) date = candidate;
    }
  }
  if (!date) issues.push('fecha no reconocida');

  const rival = rivalRaw || '';
  if (!rival) issues.push('sin rival');

  let homeAway = '';
  if (localVisRaw) {
    const lv = localVisRaw.toLowerCase();
    if (lv.indexOf('local') === 0) homeAway = 'local';
    else if (lv.indexOf('visit') === 0) homeAway = 'visitante';
  }
  if (!homeAway) issues.push('local/visitante no reconocido');

  let jornada = null;
  let type = '';
  if (jornadaRaw) {
    const jm = jornadaRaw.match(/jor/i);
    const num = jornadaRaw.match(/(\d+)/);
    if (jm && num) {
      type = 'liga';
      jornada = parseInt(num[1], 10);
    } else {
      const found = MATCH_TYPES.find(function (t) { return normalizeAccents(jornadaRaw).indexOf(normalizeAccents(t.label)) !== -1; });
      if (found) {
        type = found.id;
      } else if (num) {
        // solo un número, sin "jor" ni palabra de tipo: lo tomamos como jornada igualmente
        type = 'liga';
        jornada = parseInt(num[1], 10);
      }
    }
  }
  if (!type) { type = 'liga'; issues.push('no se reconoce "' + (jornadaRaw || '') + '" (¿jornada o tipo? revisa)'); }

  return { raw: line, date: date, rival: rival, homeAway: homeAway, type: type, jornada: jornada, issues: issues };
}

function openImportModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'rm-modal-backdrop';
  backdrop.innerHTML =
    '<div class="rm-modal" style="max-width:900px">' +
      '<button class="rm-icon-button" id="modal-close" type="button" style="position:absolute;top:16px;right:16px">✕</button>' +
      '<h2 class="rm-modal__title">Carga por lista</h2>' +
      '<div class="rm-field"><label class="rm-label">Equipo</label>' +
        '<select class="rm-select" id="imp-team">' +
          TEAMS.map(function (t) { return '<option value="' + t.id + '">' + safeText(t.short) + '</option>'; }).join('') +
        '</select></div>' +
      '<div class="rm-field"><label class="rm-label">Pega la lista (una línea por partido)</label>' +
        '<textarea class="rm-textarea" id="imp-text" rows="7" placeholder="26/09/2026 | C.F. Fuenlabrada S.A.D. Cadete A | LOCAL | Jor. 1"></textarea></div>' +
      '<button class="rm-button rm-button--gold rm-button--small" id="imp-preview" type="button">Previsualizar</button>' +
      '<div id="imp-preview-area" style="margin-top:16px"></div>' +
      '<div class="rm-modal__actions" id="imp-actions"></div>' +
    '</div>';
  document.body.appendChild(backdrop);

  qs('#modal-close', backdrop).addEventListener('click', function () { backdrop.remove(); });
  backdrop.addEventListener('click', function (e) { if (e.target === backdrop) backdrop.remove(); });

  qs('#imp-preview', backdrop).addEventListener('click', function () { renderImportPreview(backdrop); });
}

function renderImportPreview(backdrop) {
  const raw = qs('#imp-text', backdrop).value;
  const lines = raw.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  if (!lines.length) { showError('Pega al menos una línea.'); return; }

  const parsed = lines.map(parseMatchLine);
  const area = qs('#imp-preview-area', backdrop);
  area.innerHTML =
    '<div class="rm-section-title">Vista previa — revisa antes de confirmar</div>' +
    '<div class="rm-table-wrap"><table class="rm-table"><thead><tr>' +
      '<th></th><th>Fecha</th><th>Rival</th><th>L/V</th><th>Jornada</th><th>Tipo</th><th>Avisos</th>' +
    '</tr></thead><tbody>' +
      parsed.map(function (p, i) { return renderPreviewRow(p, i); }).join('') +
    '</tbody></table></div>';

  qs('#imp-actions', backdrop).innerHTML =
    '<button class="rm-button rm-button--primary" id="imp-confirm" type="button">Confirmar carga</button>';

  qs('#imp-confirm', backdrop).addEventListener('click', function () { confirmImport(backdrop); });
}

function renderPreviewRow(p, i) {
  const hasIssues = p.issues.length > 0;
  return (
    '<tr class="import-row' + (hasIssues ? ' import-row--warn' : '') + '" data-row="' + i + '">' +
      '<td><input type="checkbox" class="imp-include" checked /></td>' +
      '<td><input class="rm-input imp-date" type="date" value="' + p.date + '" style="min-height:34px;padding:6px" /></td>' +
      '<td><input class="rm-input imp-rival" type="text" value="' + safeText(p.rival) + '" style="min-height:34px;padding:6px" /></td>' +
      '<td><select class="rm-select imp-homeaway" style="min-height:34px;padding:6px">' +
        '<option value="local"' + (p.homeAway === 'local' ? ' selected' : '') + '>Local</option>' +
        '<option value="visitante"' + (p.homeAway === 'visitante' ? ' selected' : '') + '>Visitante</option>' +
      '</select></td>' +
      '<td><input class="rm-input imp-jornada" type="number" min="1" value="' + (p.jornada != null ? p.jornada : '') + '" style="min-height:34px;padding:6px;width:70px" /></td>' +
      '<td><select class="rm-select imp-type" style="min-height:34px;padding:6px">' +
        MATCH_TYPES.map(function (t) { return '<option value="' + t.id + '"' + (p.type === t.id ? ' selected' : '') + '>' + safeText(t.label) + '</option>'; }).join('') +
      '</select></td>' +
      '<td class="import-row__issues">' + (hasIssues ? safeText(p.issues.join(' · ')) : '✓') + '</td>' +
    '</tr>'
  );
}

function confirmImport(backdrop) {
  const teamId = qs('#imp-team', backdrop).value;
  const rows = qsa('.import-row', backdrop);
  const toCreate = [];
  let skipped = 0;

  rows.forEach(function (row) {
    if (!qs('.imp-include', row).checked) { skipped++; return; }
    const date = qs('.imp-date', row).value;
    if (!date) { skipped++; return; } // sin fecha no se crea, no se inventa
    const jornadaVal = qs('.imp-jornada', row).value;
    toCreate.push({
      date: date,
      time: null,
      teamId: teamId,
      rival: qs('.imp-rival', row).value.trim(),
      homeAway: qs('.imp-homeaway', row).value,
      type: qs('.imp-type', row).value,
      jornada: jornadaVal ? parseInt(jornadaVal, 10) : null,
      technicianIds: [],
    });
  });

  if (!toCreate.length) { showError('No hay ninguna fila válida para crear.'); return; }

  Promise.all(toCreate.map(function (m) { return addDocument('matches', m); }))
    .then(function () {
      showSuccess(toCreate.length + ' partidos creados' + (skipped ? ' (' + skipped + ' omitidos)' : '') + '.');
      backdrop.remove();
    })
    .catch(function (err) { showError(err.message); });
}
