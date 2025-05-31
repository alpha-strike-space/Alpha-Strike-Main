// Translation dictionary for selected elements.
// Translation dictionary for selected elements.
var translations = {}; // This will be populated by the JSON file loaded at runtime. (e.g., from .localization/translations.json)

const languages = ["en", "es", "ru", "zh"];

/**
 * Sets the language for the page and updates UI elements.
 */
function setLanguage(lang) {
  document.documentElement.lang = lang;
  localStorage.setItem("preferredLanguage", lang);

  const elements = document.querySelectorAll("[data-translate]");
  [...elements].map((element) => {
    const key = element.getAttribute("data-translate");
    // Navigate through nested keys if necessary (e.g., "navbar.home")
    // Access the translation object for the given key first, then get the specific language string.
    const translationEntry = translations[key];
    const translation = translationEntry ? translationEntry[lang] : undefined;

    if (translation) {
      // Preserve child elements like <img> by setting textContent only on text nodes
      // or by being more specific if the element is known to only contain text.
      if (
        element.childNodes.length === 1 &&
        element.childNodes[0].nodeType === Node.TEXT_NODE
      ) {
        element.textContent = translation;
      } else {
        // For more complex elements, you might need a more sophisticated update strategy
        // or ensure data-translate is on the innermost text-bearing element.
        // As a fallback, this might replace child elements if not handled carefully.
        // A common practice is to have a specific span for text: <a data-translate-key="navbar.home"><span>Home</span></a>
        // For now, let's assume direct text content or that your structure handles it.
        if (element.tagName === "INPUT" || element.tagName === "BUTTON") {
          if (
            element.placeholder !== undefined &&
            (key.includes(".placeholder") || key.includes("search.placeholder"))
          ) {
            element.placeholder = translation;
          } else {
            element.textContent = translation;
          }
        } else {
          element.innerHTML = translation;
        }
      }
    }
  });

  // Update the language button text
  const langBtn = document.getElementById("animatedLangBtn");
  if (langBtn) {
    langBtn.innerHTML = `<i class="fas fa-globe"></i> ${lang.toUpperCase()}`;
  }

  // Update currentLanguageIndex based on the set language
  const langIndex = languages.indexOf(lang);
  if (langIndex !== -1) {
    currentLanguageIndex = langIndex;
  }
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
function initializeLanguageSwitcher() {
  const animatedBtn = document.getElementById("animatedLangBtn");
  if (animatedBtn) {
    // Set initial button text from localStorage or default
    const lang = localStorage.getItem("preferredLanguage") || languages[0];
    animatedBtn.innerHTML = `<i class="fas fa-globe"></i> ${lang.toUpperCase()}`;

    animatedBtn.addEventListener("click", cycleLanguage);
  } else {
    // This might still log if called before navigation is fully ready on slower systems,
    // or if there's a persistent issue with navigation rendering.
    console.warn(
      "#animatedLangBtn not found during language switcher initialization.",
    );
  }
}

// Initial language setup on DOMContentLoaded for static content.
// The main call to setLanguage for dynamically added content will happen in initializePage.
document.addEventListener("DOMContentLoaded", async () => {
  await loadTranslations();
  const preferredLanguage =
    localStorage.getItem("preferredLanguage") || languages[0];
  // Ensure currentLanguageIndex is correctly set based on stored language
  const preferredLangIndex = languages.indexOf(preferredLanguage);
  if (preferredLangIndex !== -1) {
    currentLanguageIndex = preferredLangIndex;
  } else {
    currentLanguageIndex = 0; // Default to first language if stored one is invalid
  }
  setLanguage(languages[currentLanguageIndex]);
  // Note: initializeLanguageSwitcher() is NOT called here directly anymore.
  // It will be called by initializePage after navigation is built.
});

async function loadTranslations() {
  try {
    const response = await fetch("../localization/translations.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    translations = await response.json();
  } catch (error) {
    console.error("Failed to load translations:", error);
    // Fallback to an empty object or handle the error as needed
    translations = {
      " error.loading": {
        en: "Error loading translations",
        es: "Error al cargar las traducciones",
        ru: "Ошибка загрузки переводов",
        zh: "加载翻译时出错",
      },
    };
  }
}
