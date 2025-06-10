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

    // SVG icon, color will be set by CSS
    const svgIcon = `
<svg class="loader-svg" xmlns="http://www.w3.org/2000/svg" width="38" height="43" viewBox="0 0 38 43" fill="none">
<rect x="20.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="25.5" width="2" height="2" fill="currentColor"></rect>
</svg>`.trim();

    const svgContainer = Array(10).fill(svgIcon).join('');

    overlay.innerHTML = `
        <div class="sci-fi-loader">
            <div class="loader-svg-container">
                ${svgContainer}
            </div>
            <span class="loader-text" data-translate="loading.overlay">${message || getLoadingText()}</span>
        </div>
    `;
    document.body.appendChild(overlay);
}

export function hideLoading() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) overlay.remove();
}
