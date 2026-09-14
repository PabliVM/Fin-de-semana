// ================================================
// RENDER-FOOTER.JS
// ================================================

function renderFooter() {
  const footer = document.getElementById('rm-footer');
  if (!footer) return;
  footer.className = 'rm-footer';
  footer.textContent = FOOTER_TEXT;
}
