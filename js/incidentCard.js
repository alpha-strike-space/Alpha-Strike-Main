import { formatTimestamp, showLocalTime } from "./utils.js";
import { lazyLoader } from "./utils/lazyLoading.js";
import { translations } from "./translation-dictionary.js";

/**
 * Function to calculate time elapsed since incident
 * @param {number|string} timestamp - The timestamp
 * @returns {string} - Human readable time elapsed
 */
function getTimeElapsed(timestamp) {
  let incidentTime;

  // Use the same logic as formatTimestamp to get the correct date
  if (typeof timestamp === "string") {
    incidentTime = new Date(timestamp);
  } else if (typeof timestamp === "number") {
    if (timestamp < 10000000000) {
      incidentTime = new Date(timestamp * 1000);
    } else if (timestamp < 10000000000000) {
      incidentTime = new Date(timestamp);
    } else {
      // Windows FILETIME conversion
      const msSince1601 = timestamp / 10000;
      const epochDifference = 11644473600000;
      const msSince1970 = msSince1601 - epochDifference;
      incidentTime = new Date(msSince1970);
    }
  }

  // Validate the date
  if (
    !incidentTime ||
    Number.isNaN(incidentTime.getTime()) ||
    incidentTime.getFullYear() > 2100 ||
    incidentTime.getFullYear() < 1970
  ) {
    return "";
  }

  const now = new Date();
  const diffMs = now - incidentTime;

  // If the incident is in the future, return empty string
  if (diffMs < 0) {
    return "";
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h ago`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m ago`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  }
  return "Just now";
}

/**
 * Creates a data card element for incident display
 * @param {Object} item - The incident data, expected to have an 'id' property for the killmail ID.
 * @returns {HTMLElement|null} - The created card element or null if item is invalid.
 */
export function createIncidentCard(item) {
  if (!item || typeof item !== "object") {
    console.warn("Invalid item passed to createIncidentCard:", item);
    return null;
  }

  // Check for the presence of 'id' for the killmail link.
  if (item.id === undefined || item.id === null) {
    console.warn("Skipping card creation for item missing 'id':", item);
    return null;
  }

  const isEffectivelyEmpty =
    !item.killer_name &&
    !item.victim_name &&
    !item.loss_type &&
    !item.solar_system_name &&
    !item.time_stamp;

  if (isEffectivelyEmpty) {
    console.warn("Skipping card creation for effectively empty item:", item);
    return null;
  }

  const card = document.createElement("div");
  card.className = "incident-list-item";
  card.dataset.timestamp = item.time_stamp;

  // Create killer image with lazy loading
  const killerImg = document.createElement("img");
  killerImg.className = "profile-image";
  killerImg.alt = `Killer ${item.killer_name || "Unknown"}`;
  killerImg.dataset.src = "../assets/images/default-avatar.avif";
  lazyLoader.addLazyLoading(killerImg, killerImg.dataset.src);

  // Create victim image with lazy loading
  const victimImg = document.createElement("img");
  victimImg.className = "profile-image";
  victimImg.alt = `Victim ${item.victim_name || "Unknown"}`;
  victimImg.dataset.src = "../assets/images/default-avatar.avif";
  lazyLoader.addLazyLoading(victimImg, victimImg.dataset.src);

  const isIndexPage =
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("/Alpha-Strike-Main/");
  const assetBasePath = isIndexPage ? "./" : "../";
  const pagesBasePath = isIndexPage ? "pages/" : "";

  const formattedTimestamp = item.time_stamp
    ? formatTimestamp(item.time_stamp, showLocalTime)
    : "N/A";
  const timeElapsed = item.time_stamp ? getTimeElapsed(item.time_stamp) : "";
  const timeLabelKey = showLocalTime
    ? "card.localTimeLabel"
    : "card.utcTimeLabel";
  const placeholderProfileImage = `${assetBasePath}assets/images/default-avatar.avif`;

  const preferredLang = localStorage.getItem("preferredLanguage") || "en";

  function getTranslatedTooltip(
    key,
    placeholders = {},
    defaultTextPattern = "",
  ) {
    let pattern = defaultTextPattern;
    if (
      typeof translations !== "undefined" &&
      translations[key]?.[preferredLang]
    ) {
      pattern = translations[key][preferredLang];
    } else if (typeof translations !== "undefined" && translations[key]?.en) {
      pattern = translations[key].en; // Fallback to English from translations
    }

    for (const placeholder in placeholders) {
      pattern = pattern.replace(`{${placeholder}}`, placeholders[placeholder]);
    }
    return pattern;
  }

  const killerNameForSearch = item.killer_name || "UNKNOWN";
  const victimNameForSearch = item.victim_name || "UNKNOWN";
  const systemNameForSearch = item.solar_system_name || "UNKNOWN";

  let detailLinkHTML = "";
  // Use item.id for the killmail link directly
  const killmailId = item.id;
  const linkTooltipTextKey = "tooltip.viewKillmailDetails"; // Reusing existing tooltip key
  const linkTooltipText = getTranslatedTooltip(
    linkTooltipTextKey,
    { killmailId: killmailId },
    `View details for killmail ${killmailId}`,
  );

  detailLinkHTML = `
      <div class="incident-detail-link-container">
          <a href="${pagesBasePath}killmail.html?mail_id=${encodeURIComponent(killmailId)}"
             class="view-killmail-details-link icon-only-link"
             aria-label="${linkTooltipText}"
             title="${linkTooltipText}">
             <i class="fa-sharp fa-solid fa-arrow-up-right-from-square"></i>
          </a>
      </div>
  `;

  card.innerHTML = `
        <div class="incident-photos">
            <div class="photo-container killer-photo">
                <img src="${killerImg.dataset.src}" alt="Aggressor" class="combatant-photo"/>
            </div>
            <div class="vs-indicator"><i class="fas fa-bolt"></i></div>
            <div class="photo-container victim-photo">
                <img src="${victimImg.dataset.src}" alt="Victim" class="combatant-photo"/>
            </div>
        </div>
        <div class="incident-combatants">
            <div class="combatant-info killer-info">
                <span class="combatant-label" data-translate="card.aggressor"></span>
                <span class="combatant-name killer clickable-name" data-name="${killerNameForSearch}" title="${getTranslatedTooltip(
                  "tooltip.searchFor",
                  { itemName: killerNameForSearch },
                  `Search for ${killerNameForSearch}`,
                )}">${killerNameForSearch}<i class="fa-sharp fa-solid fa-arrow-up-right-from-square"></i></span>
            </div>
            <div class="combatant-info victim-info">
                <span class="combatant-label" data-translate="card.casualty"></span>
                <span class="combatant-name victim clickable-name" data-name="${victimNameForSearch}" title="${getTranslatedTooltip(
                  "tooltip.searchFor",
                  { itemName: victimNameForSearch },
                  `Search for ${victimNameForSearch}`,
                )}">${victimNameForSearch}<i class="fa-sharp fa-solid fa-arrow-up-right-from-square"></i></span>
            </div>
        </div>
        <div class="incident-details-compact">
            <div class="detail-group">
                <span class="detail-label" data-translate="card.lossType"></span>
                <span class="detail-value">${item.loss_type || "CLASSIFIED"}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label" data-translate="card.location"></span>
                <span class="detail-value clickable-system" data-system="${systemNameForSearch}" title="${getTranslatedTooltip(
                  "tooltip.searchFor",
                  { itemName: systemNameForSearch },
                  `Search for ${systemNameForSearch}`,
                )}">${systemNameForSearch}<i class="fa-sharp fa-solid fa-arrow-up-right-from-square"></i></span>
            </div>
        </div>
        <div class="incident-timestamp">
            <div class="timestamp-group">
                <span class="detail-label timestamp-label" data-translate="${timeLabelKey}"></span>
                <span class="timestamp-value">${formattedTimestamp}</span>
                ${timeElapsed ? `<span class="time-elapsed">${timeElapsed}</span>` : ""}
            </div>
        </div>
        ${detailLinkHTML}
    `;

  return card;
}

/**
 * Navigate to search page with pre-filled query
 * @param {string} query - The search query
 * @param {string} type - The search type ('name' or 'system')
 */
export function navigateToSearch(query, type) {
  if (!query || query === "UNKNOWN" || query === "CLASSIFIED") {
    console.warn("Cannot search for empty, unknown, or classified values");
    return;
  }

  // Determine the correct path to search.html based on current page
  const isIndexPage =
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("/Alpha-Strike-Main/"); // Adjusted for potential base path
  const searchPagePath = isIndexPage
    ? "pages/search.html"
    : window.location.pathname.includes("/pages/")
      ? "search.html"
      : "../pages/search.html";

  // Create URL with search parameters
  const searchUrl = `${searchPagePath}?query=${encodeURIComponent(query)}&type=${type}`;

  // Navigate to search page
  window.location.href = searchUrl;
}

/**
 * Add click event listeners to incident cards for navigation
 * This should be called after cards are added to the DOM
 */
export function addIncidentCardListeners() {
  // Add listeners for clickable names
  for (const element of document.querySelectorAll(".clickable-name")) {
    // Check if a listener has already been attached to this element
    if (!element.dataset.listenerAttached) {
      element.addEventListener("click", (e) => {
        e.preventDefault();
        const name = element.dataset.name;
        if (name && name !== "UNKNOWN") {
          navigateToSearch(name, "name");
        }
      });
      element.dataset.listenerAttached = "true"; // Mark as attached
    }
  }

  // Add listeners for clickable systems
  for (const element of document.querySelectorAll(".clickable-system")) {
    if (!element.dataset.listenerAttached) {
      element.addEventListener("click", (e) => {
        e.preventDefault();
        const system = element.dataset.system;
        if (system && system !== "UNKNOWN") {
          navigateToSearch(system, "system");
        }
      });
      element.dataset.listenerAttached = "true"; // Mark as attached
    }
  }
}
