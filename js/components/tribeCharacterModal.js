// Lightweight reusable modal for listing characters in a tribe

// Exports: showTribeCharacterModal(characters: Array<Object>): void

import { fetchTribeByName } from "../api.js";
import { navigateToSearch } from "../incidentCard.js";
import { showInlineLoader, hideInlineLoader } from "./inline-loader.js";

let modalInitialized = false;
let backdropEl = null;
let modalEl = null;
let characterListEl = null;

function hide() {
  if (!backdropEl || !modalEl) return;
  backdropEl.style.display = 'none';
  modalEl.classList.remove('visible');
}

function initializeModalIfNeeded() {
  if (modalInitialized) return;

  // Use dedicated modal CSS classes
  backdropEl = document.createElement('div');
  backdropEl.className = 'modal-backdrop';

  modalEl = document.createElement('div');
  modalEl.className = 'modal-container modal-container--scrollable';

  const header = document.createElement('div');
  header.className = 'modal-header';
  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-users';
  const title = document.createElement('h3');
  const closeIcon = document.createElement('i');
  closeIcon.className = 'fa-solid fa-xmark modal-close-icon';
  closeIcon.style.cursor = 'pointer';
  closeIcon.setAttribute('aria-label', 'Close');
  closeIcon.addEventListener('click', () => {
    hide();
  });
  title.className = 'modal-title';
  title.textContent = 'Characters in Tribe';
  header.appendChild(icon);
  header.appendChild(title);
  header.appendChild(closeIcon);
  const body = document.createElement('div');
  body.className = 'modal-body';

  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'modal-scroll';

  characterListEl = document.createElement('div');
  characterListEl.className = 'modal-character-list';

  scrollContainer.appendChild(characterListEl);
  body.appendChild(scrollContainer);

  modalEl.appendChild(header);
  modalEl.appendChild(body);
  backdropEl.appendChild(modalEl);
  document.body.appendChild(backdropEl);

  backdropEl.addEventListener('click', (e) => {
    if (e.target === backdropEl) hide();
  });
  document.addEventListener('keydown', (e) => {
    if (backdropEl.style.display !== 'none' && e.key === 'Escape') hide();
  });

  modalInitialized = true;
}

async function showTribeCharacterModal(tribeName) {
  initializeModalIfNeeded();
  backdropEl.style.display = 'flex';
  requestAnimationFrame(() => modalEl.classList.add('visible'));
  // Clear previous characters
  if (characterListEl) characterListEl.innerHTML = '';
  // Show inline loader while fetching
  showInlineLoader(characterListEl, 'Loading Characters...');
//   APi expects a limit and offset, so we need to fetch the characters in chunks
// The API returns the total number of characters in a tribe, regardless of limit.
  try {
    const tribe = await fetchTribeByName(tribeName, 1, 0);
    const totalCharacters = tribe.member_count || 0;
    const characters = await fetchTribeByName(tribeName, totalCharacters, 0);
    hideInlineLoader(characterListEl);
    (characters.members || []).forEach(character => {
      const item = document.createElement('div');
      item.className = 'modal-character-item';
      item.style = "margin: 0 1rem";
      const nameEl = document.createElement('span');
      nameEl.className = 'modal-character-name';
      nameEl.textContent = character.member_name;

      const iconEl = document.createElement('i');
      iconEl.className = 'fa-sharp fa-solid fa-arrow-up-right-from-square';

      item.appendChild(nameEl);
      item.appendChild(iconEl);
      item.title = `Search for ${character.member_name}`;
      item.addEventListener('click', () => {
        navigateToSearch(character.member_name, 'name');
      });
      characterListEl.appendChild(item);
    });
  } catch (error) {
    console.error('Failed to load tribe characters', error);
    hideInlineLoader(characterListEl);
    characterListEl.textContent = 'Failed to load characters.';
  }
}

export { showTribeCharacterModal };