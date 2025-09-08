// Lightweight reusable modal for external link warnings
// Exports: showExternalLinkModal(url: string): void

let modalInitialized = false;
let backdropEl = null;
let modalEl = null;
let confirmBtn = null;
let cancelBtn = null;
let messageEl = null;

function initializeModalIfNeeded() {
  if (modalInitialized) return;

  // Use dedicated modal CSS classes
  backdropEl = document.createElement('div');
  backdropEl.className = 'modal-backdrop';

  modalEl = document.createElement('div');
  modalEl.className = 'modal-container';

  const header = document.createElement('div');
  header.className = 'modal-header';
  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-triangle-exclamation';
  const title = document.createElement('h3');
  title.className = 'modal-title';
  title.textContent = 'Leaving Alpha Strike';
  header.appendChild(icon);
  header.appendChild(title);

  const body = document.createElement('div');
  body.className = 'modal-body';
  messageEl = document.createElement('p');
  messageEl.className = 'modal-message';
  messageEl.textContent = 'You are about to open an external link. We are not responsible for the content or your safety on external websites.';
  body.appendChild(messageEl);

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn-secondary';
  cancelBtn.textContent = 'Cancel';

  confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'btn-primary';
  confirmBtn.textContent = 'Continue';

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);

  modalEl.appendChild(header);
  modalEl.appendChild(body);
  modalEl.appendChild(actions);
  backdropEl.appendChild(modalEl);
  document.body.appendChild(backdropEl);

  // Close handlers
  function hide() {
    backdropEl.style.display = 'none';
    modalEl.classList.remove('visible');
    confirmBtn.onclick = null;
  }

  cancelBtn.addEventListener('click', hide);
  backdropEl.addEventListener('click', (e) => {
    if (e.target === backdropEl) hide();
  });
  document.addEventListener('keydown', (e) => {
    if (backdropEl.style.display !== 'none' && e.key === 'Escape') hide();
  });

  modalInitialized = true;
}

function showModal(onConfirm) {
  initializeModalIfNeeded();
  backdropEl.style.display = 'flex';
  requestAnimationFrame(() => modalEl.classList.add('visible'));
  confirmBtn.onclick = () => {
    try {
      onConfirm?.();
    } finally {
      backdropEl.style.display = 'none';
      modalEl.classList.remove('visible');
      confirmBtn.onclick = null;
    }
  };
}

function normalizeUrl(url) {
  try {
    // Will throw if invalid
    // eslint-disable-next-line no-new
    new URL(url);
    return url;
  } catch (_) {
    return url;
  }
}

function openInNewTab(url) {
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (win && typeof win.focus === 'function') {
    win.focus();
  }
}

function showExternalLinkModal(url) {
  const safeUrl = normalizeUrl(url);
  showModal(() => openInNewTab(safeUrl));
}

export { showExternalLinkModal };


