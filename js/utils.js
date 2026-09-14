// ================================================
// UTILS.JS — Funciones comunes
// ================================================

function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
function qsa(sel, ctx) { return [].slice.call((ctx || document).querySelectorAll(sel)); }

function safeText(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('/');
}

function toLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function addDaysISO(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toLocalISO(d);
}

function todayISO() {
  return toLocalISO(new Date());
}

// Domingo del finde en curso/próximo: el domingo más cercano >= hoy.
// Si hoy es lunes 14/09, devuelve el domingo 20/09 (mismo criterio que usa Pablo).
function nextWeekendDate(baseDateStr) {
  const base = baseDateStr ? new Date(baseDateStr + 'T00:00:00') : new Date();
  const day = base.getDay(); // 0 = domingo
  const daysUntilSunday = (7 - day) % 7;
  const sunday = new Date(base);
  sunday.setDate(base.getDate() + daysUntilSunday);
  return toLocalISO(sunday);
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function safeStorageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function safeStorageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* bloqueado (file://, privacidad, etc.) */ }
}

let _toastTimer;
function showToast(msg, type) {
  const toast = document.getElementById('rm-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'rm-toast rm-toast--' + (type || 'info') + ' is-visible';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function () { toast.className = 'rm-toast'; }, 3500);
}

function showError(msg) { showToast(msg, 'error'); }
function showSuccess(msg) { showToast(msg, 'success'); }
