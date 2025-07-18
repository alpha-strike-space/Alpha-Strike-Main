// Translation dictionary for selected elements.
export let translations = {}; // This will be populated by the JSON file loaded at runtime. (e.g., from .localization/translations.json)
export const languages = ['en', 'es', 'ru', 'zh'];
export let currentLanguageIndex = 0; // Index of the currently selected language in the languages array

/**
 * Applies translations to all elements with `data-translate` within a given scope.
 * @param {HTMLElement} scope - The element to search within for translatable elements.
 * @param {string} lang - The target language code (e.g., 'en', 'es').
 */
export function applyTranslationsToElement(scope, lang) {
  const elements = scope.querySelectorAll('[data-translate]');

  [...elements].map((element) => {
    const key = element.getAttribute('data-translate');
    const translationEntry = translations[key];
    // Fallback to English if specific lang not found, then to key if English also not found for that key
    const translation = translationEntry
      ? translationEntry[lang] || translationEntry.en || key
      : key;

    if (translation) {
      // Simplified update logic for brevity, ensure your existing logic for icons etc. is retained
      if (
        element.tagName === 'INPUT' &&
        element.placeholder !== undefined &&
        (key.includes('.placeholder') || key.endsWith('Placeholder'))
      ) {
        element.placeholder = translation;
      } else if (
        element.tagName === 'BUTTON' ||
        element.classList.contains('timezone-toggle-floating')
      ) {
        const iconElement = element.querySelector('i');
        const textSpan = element.querySelector('span[data-translate]'); // Preferentially update span if it exists
        if (textSpan && textSpan.getAttribute('data-translate') === key) {
          textSpan.textContent = translation;
        } else if (iconElement) {
          element.innerHTML = `${iconElement.outerHTML} ${translation}`;
        } else {
          element.textContent = translation;
        }
      } else {
        // For most elements, try to preserve child <i> tags if they are the first child
        const firstChild = element.firstChild;
        if (
          firstChild &&
          firstChild.nodeType === Node.ELEMENT_NODE &&
          firstChild.tagName === 'I'
        ) {
          element.innerHTML = `${firstChild.outerHTML} ${translation}`;
        } else {
          element.textContent = translation;
        }
      }
    }
  });
}

/**
 * Sets the language for the page and updates UI elements.
 */
export function setLanguage(lang) {
  document.documentElement.lang = lang;
  localStorage.setItem('preferredLanguage', lang);

  applyTranslationsToElement(document, lang);

  const langBtn = document.getElementById('animatedLangBtn');
  if (langBtn) {
    const icon = langBtn.querySelector('i.fa-globe');
    const iconHTML = icon ? `${icon.outerHTML} ` : '';
    langBtn.innerHTML = `${iconHTML}${lang.toUpperCase()}`;
  }

  const langIndex = languages.indexOf(lang);
  if (langIndex !== -1) {
    currentLanguageIndex = langIndex;
  }

  // Dispatch a custom event to notify other components of the change.
  const event = new CustomEvent("languagechange", { detail: { lang } });
  document.dispatchEvent(event);

  // --- MODIFICATION START ---
  // Call the page-specific re-render function if it's defined
  // This allows pages like killmail-detail.js to refresh their dynamic content
  if (
    window.AlphaStrike &&
    typeof window.AlphaStrike.onLanguageChangeRenderContent === 'function'
  ) {
    console.log(
      'Calling window.AlphaStrike.onLanguageChangeRenderContent() due to language change.'
    );
    window.AlphaStrike.onLanguageChangeRenderContent();
  }
  // --- MODIFICATION END ---
}

/**
 * Cycles to the next language and applies it.
 */
function cycleLanguage() {
  currentLanguageIndex = (currentLanguageIndex + 1) % languages.length;
  const nextLang = languages[currentLanguageIndex];
  setLanguage(nextLang);
}

/**
 * Initializes the language switcher button.
 * This function will be called after the navigation is rendered.
 */
export function initializeLanguageSwitcher() {
  const animatedBtn = document.getElementById('animatedLangBtn');
  if (animatedBtn) {
    // Set initial button text from localStorage or default
    const lang = localStorage.getItem('preferredLanguage') || languages[0];
    const icon = animatedBtn.querySelector('i.fa-globe'); // Get existing icon
    const iconHTML = icon ? `${icon.outerHTML} ` : '<i class="fas fa-globe"></i> '; // Fallback icon
    animatedBtn.innerHTML = `${iconHTML}${lang.toUpperCase()}`;

    animatedBtn.addEventListener('click', cycleLanguage);
  } else {
    console.warn('#animatedLangBtn not found during language switcher initialization.');
  }
}

// Load translations and then set the initial language.
// This ensures `translations` object is populated before `setLanguage` is called.
export async function loadTranslations() {
  try {
    // Adjust the path based on where this script is likely to be imported from.
    // If imported in files within /js/, then '../localization/translations.json' is correct.
    // If imported from index.html, then './localization/translations.json' or 'localization/translations.json'.
    // Assuming common.js (where initializePage is) is in /js/, this path should generally work from there.
    // For killmail-detail.js (in /js/), this path is also correct.
    let pathPrefix = '';
    // Heuristic to determine path prefix based on current URL
    if (window.location.pathname.includes('/pages/')) {
      pathPrefix = '../';
    } else if (
      window.location.pathname.endsWith('/') ||
      window.location.pathname.endsWith('.html')
    ) {
      // Root or direct HTML file in root
      pathPrefix = './'; // or just '' depending on server setup
    }

    const response = await fetch(`${pathPrefix}localization/translations.json`);
    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} for translations.json at ${pathPrefix}localization/translations.json`
      );
    }
    translations = await response.json();
    console.log('Translations loaded successfully.');
  } catch (error) {
    console.error('Failed to load translations:', error);
    translations = {
      'error.loading': {
        en: 'Error loading translations',
        es: 'Error al cargar las traducciones',
        ru: 'Ошибка загрузки переводов',
        zh: '加载翻译时出错',
      },
    };
  }
}

// Initial language setup on DOMContentLoaded.
// This event listener ensures that translations are loaded and the initial language is set
// as soon as the basic DOM structure is ready.
document.addEventListener('DOMContentLoaded', async () => {
  await loadTranslations(); // Ensure translations are loaded first
  const preferredLanguage = localStorage.getItem('preferredLanguage') || languages[0];
  const preferredLangIndex = languages.indexOf(preferredLanguage);
  if (preferredLangIndex !== -1) {
    currentLanguageIndex = preferredLangIndex;
  } else {
    currentLanguageIndex = 0; // Default to the first language if stored one is invalid
  }
  setLanguage(languages[currentLanguageIndex]); // Apply the language
  // initializeLanguageSwitcher() is called by initializePage after navigation is built.
});
