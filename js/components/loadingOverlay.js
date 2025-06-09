import { translations, languages, currentLanguageIndex } from '../translation-dictionary.js';

function getLoadingText() {
    const lang = languages[currentLanguageIndex];
    const entry = translations["loading.overlay"];
    return entry ? (entry[lang] || entry.en || "Loading...") : "Loading...";
}

export function showLoading(message) {
    let overlay = document.createElement("div");
    overlay.id = "loading-overlay";
    overlay.className = "sci-fi-loading-overlay";
    overlay.innerHTML = `
        <div class="sci-fi-loader">
            <div class="loader-bar"></div>
            <div class="loader-bar"></div>
            <div class="loader-bar"></div>
            <span class="loader-text" data-translate="loading.overlay">${message || getLoadingText()}</span>
        </div>
    `;
    document.body.appendChild(overlay);
}

export function hideLoading() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) overlay.remove();
}
