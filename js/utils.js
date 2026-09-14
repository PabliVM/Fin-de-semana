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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
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
