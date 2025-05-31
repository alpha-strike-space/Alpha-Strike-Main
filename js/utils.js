// Global var to track timezone prefs
let showLocalTime = true;

/**
 * Function to format the timestamp in user's local time
 * @param {number} timestamp - The Windows FILETIME timestamp
 * @param {boolean} showLocal - Whether to show local time (default: true)
 * @returns {string} - Formatted timestamp string
 */
function formatTimestamp(timestamp, showLocal = true) {
  let date;

  // Try different timestamp formats to determine the correct one
  if (typeof timestamp === "string") {
    // If it's already a string, try to parse it
    date = new Date(timestamp);
  } else if (typeof timestamp === "number") {
    // Check if it's a Unix timestamp (seconds since 1970)
    if (timestamp < 10000000000) {
      // Likely Unix timestamp in seconds
      date = new Date(timestamp * 1000);
    } else if (timestamp < 10000000000000) {
      // Likely Unix timestamp in milliseconds
      date = new Date(timestamp);
    } else {
      // This is a Windows FILETIME timestamp (100-nanosecond intervals since Jan 1, 1601)
      // Convert to milliseconds since 1601
      const msSince1601 = timestamp / 10000;
      // Calculate the difference between Jan 1, 1601 and Jan 1, 1970 in milliseconds
      const epochDifference = 11644473600000; // Correct value: 11,644,473,600,000 ms
      // Convert to Unix timestamp in milliseconds (since Jan 1, 1970)
      const msSince1970 = msSince1601 - epochDifference;
      date = new Date(msSince1970);
    }
  }

  // Validate the date
  if (
    !date ||
    Number.isNaN(date.getTime()) ||
    date.getFullYear() > 2100 ||
    date.getFullYear() < 1970
  ) {
    console.warn("Invalid timestamp:", timestamp);
    return "INVALID TIMESTAMP";
  }

  if (showLocal) {
    // Format as local time with timezone info
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    // Get timezone abbreviation
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeZoneShort = date
      .toLocaleTimeString("en-US", { timeZoneName: "short" })
      .split(" ")[2];

    // Return in military/sci-fi format with local timezone
    return `${year}.${month}.${day} - ${hours}:${minutes}:${seconds} ${timeZoneShort}`;
  }
  // Format as UTC (original behavior)
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  // Return in military/sci-fi format: YYYY.MM.DD - HH:MM:SS UTC
  return `${year}.${month}.${day} - ${hours}:${minutes}:${seconds} UTC`;
}

/**
 * Toggle between local time and UTC display
 */
function toggleTimezone() {
  showLocalTime = !showLocalTime;

  // Get current language from HTML tag once at the beginning
  const currentLang =
    document.documentElement.lang ||
    (typeof languages !== "undefined" ? languages[0] : "en");

  // Update all timestamp displays
  const timestampElements = document.querySelectorAll(".timestamp-value");
  [...timestampElements].map((element) => {
    const card = element.closest(".incident-list-item");
    if (card?.dataset.timestamp) {
      element.textContent = formatTimestamp(
        Number.parseInt(card.dataset.timestamp),
        showLocalTime,
      );
    }
  });

  // Update toggle button text using localization
  const toggleBtn = document.getElementById("timezone-toggle");
  if (toggleBtn) {
    const toggleSpan = toggleBtn.querySelector("span[data-translate]");
    if (toggleSpan) {
      const newKey = showLocalTime ? "timezone.showUtc" : "timezone.showLocal";
      toggleSpan.setAttribute("data-translate", newKey);

      // Look up the translation
      const translationEntry = translations[newKey];
      const translation = translationEntry
        ? translationEntry[currentLang]
        : undefined;

      if (translation) {
        toggleSpan.textContent = translation;
      } else {
        // Fallback to English or key if translation is missing
        toggleSpan.textContent = translationEntry
          ? translationEntry.en
          : newKey;
        console.warn(
          `Translation not found for key: ${newKey}, lang: ${currentLang}. Using fallback.`,
        );
      }
    }
  }

  // Update label text for timestamp dynamically
  const timestampLabels = document.querySelectorAll(
    ".timestamp-group .detail-label",
  ); // Corrected selector

  [...timestampLabels].map((label) => {
    const newKey = showLocalTime ? "card.localTimeLabel" : "card.utcTimeLabel";
    label.setAttribute("data-translate", newKey);

    if (
      typeof translations !== "undefined" &&
      translations[newKey] &&
      translations[newKey][currentLang]
    ) {
      label.textContent = translations[newKey][currentLang];
    } else {
      let fallbackText = newKey.replace("card.", "").replace("Label", "");
      fallbackText = `${fallbackText.charAt(0).toUpperCase() + fallbackText.slice(1)} TIME:`;
      label.textContent = fallbackText;
      console.warn(
        `Translation not found for key: ${newKey}, lang: ${currentLang}. Using fallback.`,
      );
    }
  });
}

/**
 * Function to calculate time elapsed since incident
 * @param {number} timestamp - The timestamp
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
 * @param {Object} item - The incident data
 * @returns {HTMLElement} - The created card element
 */
function createIncidentCard(item) {
  if (!item || typeof item !== "object") {
    console.warn("Invalid item passed to createIncidentCard:", item);
    return null;
  }

  const isEffectivelyEmpty =
    !item.killer_name &&
    !item.victim_name &&
    !item.loss_type &&
    !item.solar_system_name &&
    !item.time_stamp;

  if (isEffectivelyEmpty) {
    console.warn(
      "Skipping card creation for item with all essential fields missing:",
      item,
    );
    return null;
  }

  const listItem = document.createElement("div");
  listItem.classList.add("incident-list-item");

  if (item.time_stamp) {
    listItem.dataset.timestamp = item.time_stamp;
  }

  const isIndexPage =
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("/Alpha-Strike-Main/");
  const assetBasePath = isIndexPage ? "" : "../";
  const pagesBasePath = isIndexPage ? "pages/" : "";

  const formattedTimestamp = item.time_stamp
    ? formatTimestamp(item.time_stamp, showLocalTime)
    : "N/A";
  const timeElapsed = item.time_stamp ? getTimeElapsed(item.time_stamp) : "";
  const timeLabelKey = showLocalTime
    ? "card.localTimeLabel"
    : "card.utcTimeLabel";
  const placeholderProfileImage = `${assetBasePath}assets/images/awakened.avif`;

  const tempKillmailKey = `km_detail_${item.time_stamp}_${(item.victim_name || '').replace(/\s/g, '')}`;

  const preferredLang = localStorage.getItem('preferredLanguage') || 'en';

  function getTranslatedTooltip(key, placeholders = {}, defaultTextPattern = "") {
    let pattern = defaultTextPattern;
    if (typeof translations !== 'undefined' && translations[key]?.[preferredLang]) {
        pattern = translations[key][preferredLang];
    } else if (typeof translations !== 'undefined' && translations[key]?.en) {
        pattern = translations[key].en; // Fallback to English from translations
    }

    for (const placeholder in placeholders) {
        pattern = pattern.replace(`{${placeholder}}`, placeholders[placeholder]);
    }
    return pattern;
  }
  // For clickable names/systems
  const killerNameForSearch = item.killer_name || "UNKNOWN";
  const victimNameForSearch = item.victim_name || "UNKNOWN";
  const systemNameForSearch = item.solar_system_name || "UNKNOWN";

  const searchKillerTooltip = getTranslatedTooltip("tooltip.searchFor", { itemName: killerNameForSearch }, `Search for ${killerNameForSearch}`);
  const searchVictimTooltip = getTranslatedTooltip("tooltip.searchFor", { itemName: victimNameForSearch }, `Search for ${victimNameForSearch}`);
  const searchSystemTooltip = getTranslatedTooltip("tooltip.searchFor", { itemName: systemNameForSearch }, `Search for ${systemNameForSearch}`);

  let detailLinkHTML = "";
  try {
    // Store the full item data in sessionStorage for the detail page to retrieve
    // Note: sessionStorage has size limits (usually around 5MB)
    sessionStorage.setItem(tempKillmailKey, JSON.stringify(item));

    const preferredLang = localStorage.getItem('preferredLanguage') || 'en';
    const linkTextDefault = "View Details";
    // Ensure translations object is loaded and accessible, or provide a robust fallback
    const linkTooltipDefault = "View Details";
    // Use the existing translation key for the tooltip/aria-label
    const linkTooltipText = ((typeof translations !== 'undefined' && translations["link.viewKillmailDetails"]?.[preferredLang]) || viewDetailsTooltipDefault)
    detailLinkHTML = `
        <div class="incident-detail-link-container">
            <a href="${pagesBasePath}killmail.html?tempKey=${encodeURIComponent(tempKillmailKey)}" 
               class="view-killmail-details-link icon-only-link" 
               aria-label="${linkTooltipText}"
               title="${linkTooltipText}">
               <i class="fa-sharp fa-solid fa-arrow-up-right-from-square"></i>
            </a>
        </div>
    `;
  } catch (e) {
      console.error("Could not set item in sessionStorage (maybe full or disabled?):", e);
      detailLinkHTML = `<div class="incident-detail-link-container"><span class="no-detail-link" data-translate="link.noDetailsAvailable">Details N/A (Error)</span></div>`;
  }

  listItem.innerHTML = `
        <div class="incident-photos">
            <div class="photo-container killer-photo">
                <img src="${placeholderProfileImage}" alt="Aggressor" class="combatant-photo"/>
            </div>
            <div class="vs-indicator"><i class="fas fa-bolt"></i></div>
            <div class="photo-container victim-photo">
                <img src="${placeholderProfileImage}" alt="Victim" class="combatant-photo"/>
            </div>
        </div>
        <div class="incident-combatants">
            <div class="combatant-info killer-info">
                <span class="combatant-label" data-translate="card.aggressor"></span>
                <span class="combatant-name killer clickable-name" data-name="${item.killer_name || "UNKNOWN"}" title="Search for ${item.killer_name || "UNKNOWN"}">${item.killer_name || "UNKNOWN"}<i class="fa-sharp fa-solid fa-arrow-up-right-from-square"></i></span>
            </div>
            <div class="combatant-info victim-info">
                <span class="combatant-label" data-translate="card.casualty"></span>
                <span class="combatant-name victim clickable-name" data-name="${item.victim_name || "UNKNOWN"}" title="Search for ${item.victim_name || "UNKNOWN"}">${item.victim_name || "UNKNOWN"}<i class="fa-sharp fa-solid fa-arrow-up-right-from-square"></i></span>
            </div>
        </div>
        <div class="incident-details-compact">
            <div class="detail-group">
                <span class="detail-label" data-translate="card.lossType"></span>
                <span class="detail-value">${item.loss_type || "CLASSIFIED"}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label" data-translate="card.location"></span>
                <span class="detail-value clickable-system" data-system="${item.solar_system_name || "UNKNOWN"}" title="Search for ${item.solar_system_name || "UNKNOWN"}">${item.solar_system_name || "UNKNOWN"}<i class="fa-sharp fa-solid fa-arrow-up-right-from-square"></i></span>
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

  return listItem;
}

/**
 * Navigate to search page with pre-filled query
 * @param {string} query - The search query
 * @param {string} type - The search type ('name' or 'system')
 */
function navigateToSearch(query, type) {
  if (!query || query === "UNKNOWN" || query === "CLASSIFIED") {
    console.warn("Cannot search for empty, unknown, or classified values");
    return;
  }

  // Determine the correct path to search.html based on current page
  const isIndexPage =
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/";
  const searchPagePath = isIndexPage ? "pages/search.html" : "search.html";

  // Create URL with search parameters
  const searchUrl = `${searchPagePath}?query=${encodeURIComponent(query)}&type=${type}`;

  // Navigate to search page
  window.location.href = searchUrl;
}

/**
 * Add click event listeners to incident cards for navigation
 * This should be called after cards are added to the DOM
 */
function addIncidentCardListeners() {
  // Add listeners for clickable names
  for (const element of document.querySelectorAll(".clickable-name")) {
    element.addEventListener("click", (e) => {
      e.preventDefault();
      const name = element.dataset.name;
      if (name && name !== "UNKNOWN") {
        navigateToSearch(name, "name");
      }
    });
  }

  // Add listeners for clickable systems
  for (const element of document.querySelectorAll(".clickable-system")) {
    element.addEventListener("click", (e) => {
      e.preventDefault();
      const system = element.dataset.system;
      if (system && system !== "UNKNOWN") {
        navigateToSearch(system, "system");
      }
    });
  }
}

/**
 * Debug function to help identify timestamp format
 * @param {*} timestamp - The timestamp to analyze
 */
function debugTimestamp(timestamp) {
  console.log("=== Timestamp Debug ===");
  console.log("Raw timestamp:", timestamp);
  console.log("Type:", typeof timestamp);

  if (typeof timestamp === "number") {
    console.log("As Unix seconds:", new Date(timestamp * 1000));
    console.log("As Unix milliseconds:", new Date(timestamp));
    console.log("As microseconds:", new Date(timestamp / 1000));
    console.log("As nanoseconds:", new Date(timestamp / 10000));

    // Windows FILETIME conversion
    const msSince1601 = timestamp / 10000;
    const epochDifference = 11644473600000;
    const msSince1970 = msSince1601 - epochDifference;
    const date = new Date(msSince1970);
    console.log("As Windows FILETIME (UTC):", date.toUTCString());
    console.log("As Windows FILETIME (Local):", date.toString());
  }
  console.log("======================");
}
