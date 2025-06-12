import { initializeNavigation } from "../components/navigation.js";
import {
  initializeLanguageSwitcher,
  languages,
  setLanguage,
} from "./translation-dictionary.js";
import { addIncidentCardListeners } from "./incidentCard.js";
import { toggleTimezone } from "./utils.js";
import { initializeSearchPage } from "./search.js";

// --- Portrait Image Mapping ---
const portraitUrlMapping = {
  "https://artifacts.evefrontier.com/portraits/PortraitAwakened256.png":
    "assets/images/portraits/PortraitAwakened256.avif",
  "https://artifacts.evefrontier.com/portraits/PortraitAscended256.png":
    "assets/images/portraits/PortraitAscended256.avif",
  "https://artifacts.evefrontier.com/portraits/PortraitRainmakers256.png":
    "assets/images/portraits/PortraitRainmakers256.avif",
  "https://artifacts.evefrontier.com/portraits/PortraitInitiated256.png":
    "assets/images/portraits/PortraitInitiated256.avif",
  "https://artifacts.evefrontier.com/Character/123456789_256.jpg":
    "assets/images/portraits/123456789_256.avif",
  "https://artifacts.evefrontier.com/portraits/PortraitSeers256.png":
    "assets/images/portraits/PortraitSeers256.avif",
  "https://artifacts.evefrontier.com/portraits/PortraitHarbingers256.png":
    "assets/images/portraits/PortraitHarbingers256.avif",
};

/**
 * Maps an external portrait URL to a local path.
 * @param {string|null} externalUrl The full URL of the portrait from the API.
 * @param {string} assetBasePath The base path for assets (e.g., './' or '../').
 * @returns {string} The local path to the portrait image.
 */
export function getLocalPortraitPath(externalUrl, assetBasePath) {
  const placeholder = `${assetBasePath}assets/images/default-avatar.avif`;
  if (!externalUrl) {
    return placeholder;
  }

  const localPath = portraitUrlMapping[externalUrl];

  if (localPath) {
    return assetBasePath + localPath;
  } else {
    console.warn(
      `Missing local mapping for portrait URL: "${externalUrl}". Using default avatar. Please download the image and update the portraitUrlMapping in js/common.js.`,
    );
    return placeholder;
  }
}

/**
 * Common functionality shared across pages
 */

/**
 * Initialize common page elements
 * @param {string} activePage - The currently active page
 */
export function initializePage(activePage) {
  // Initialize navigation (this creates the #animatedLangBtn in the DOM)
  if (typeof initializeNavigation === "function") {
    initializeNavigation(activePage);
  } else {
    console.error(
      "initializeNavigation function is not defined. Ensure components/navigation.js is loaded.",
    );
    // Early exit or fallback if navigation is critical
    return;
  }

  // Now that navigation is in the DOM (including #animatedLangBtn),
  // initialize the language switcher logic.
  if (typeof initializeLanguageSwitcher === "function") {
    initializeLanguageSwitcher();
  } else {
    console.error(
      "initializeLanguageSwitcher function not found. Ensure translation-dictionary.js is loaded correctly and defines it.",
    );
  }

  // Attach event listener for the timezone toggle button
  const timezoneToggleButton = document.getElementById("timezone-toggle");
  if (timezoneToggleButton) {
    // Check if a listener is already attached to prevent duplicates if initializePage were called multiple times
    // (though it should typically run once per full page load).
    if (!timezoneToggleButton.hasAttribute("data-listener-attached")) {
      timezoneToggleButton.addEventListener("click", toggleTimezone);
      timezoneToggleButton.setAttribute("data-listener-attached", "true"); // Mark as attached
    }
  }

  // Apply/re-apply translations to ensure all content (static and dynamic) is translated.
  // The DOMContentLoaded in translation-dictionary.js handles initial static content.
  // initializeLanguageSwitcher sets the button text.
  // This call ensures everything is up-to-date after all initial setup.
  if (
    typeof setLanguage === "function" &&
    typeof languages !== "undefined" &&
    languages.length > 0
  ) {
    const currentLang =
      localStorage.getItem("preferredLanguage") || languages[0];
    setLanguage(currentLang);
  } else {
    console.error(
      "setLanguage function or languages array not found. Translation system might not be fully initialized.",
    );
  }

  initializeSearchPage(); // Add search initialization to all pages
}

/**
 * Display data in a container with error handling
 * @param {Array} data - Array of data items
 * @param {string} containerId - ID of the container element
 * @param {Function} createCardFn - Function to create card elements
 * @param {Object} options - Additional options
 */
export function displayDataInContainer(
  data,
  containerId,
  createCardFn,
  options = {},
) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID ${containerId} not found`);
    return;
  }

  container.innerHTML = ""; // Clear previous content

  if (!data || data.length === 0) {
    container.textContent = options.noDataMessage || "No data available.";
    return;
  }

  // Sort and limit if specified
  if (options.sortBy && options.sortDirection) {
    data.sort((a, b) => {
      // Ensure 'a' and 'b' are objects and have the sortBy property before accessing it
      const valA =
        a &&
        typeof a === "object" &&
        Object.prototype.hasOwnProperty.call(a, options.sortBy)
          ? a[options.sortBy]
          : undefined;
      const valB =
        b &&
        typeof b === "object" &&
        Object.prototype.hasOwnProperty.call(b, options.sortBy)
          ? b[options.sortBy]
          : undefined;

      // Handle cases where values might be undefined or null for robust sorting
      if (valA === undefined || valA === null)
        return options.sortDirection === "desc" ? 1 : -1; // Push undefined/null to the end for desc, beginning for asc
      if (valB === undefined || valB === null)
        return options.sortDirection === "desc" ? -1 : 1; // Push undefined/null to the end for desc, beginning for asc

      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return options.sortDirection === "desc" ? comparison * -1 : comparison;
    });
  }

  let limitedData = data;
  if (options.limit) {
    limitedData = data.slice(0, options.limit);
  }

  // Create and append cards
  [...limitedData].map((item) => {
    // Ensure item is valid before creating a card
    const card = createCardFn(item);
    if (card) container.appendChild(card);
    else console.warn("Skipping invalid card for item:", item);
  });

  if (typeof addIncidentCardListeners === "function")
    addIncidentCardListeners();

  // Update translations for newly added dynamic content
  if (
    typeof setLanguage === "function" &&
    typeof languages !== "undefined" &&
    languages.length > 0
  ) {
    const currentLang =
      localStorage.getItem("preferredLanguage") || languages[0];
    setLanguage(currentLang);
  }
}
