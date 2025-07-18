import { languages, translations } from "./translation-dictionary.js";
import { lazyLoader } from "./utils/lazyLoading.js";

// Global var to track timezone prefs
export let showLocalTime = true;

/**
 * Function to format the timestamp in user's local time
 * @param {number|string} timestamp - The timestamp (Windows FILETIME, Unix seconds/milliseconds, or ISO string)
 * @param {boolean} showLocal - Whether to show local time (default: true)
 * @returns {string} - Formatted timestamp string
 */
export function formatTimestamp(timestamp, showLocal = true, lang = "en") {
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
    // const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Not used directly
    const timeZoneShort = date
      .toLocaleTimeString(lang, { timeZoneName: "short" })
      .split(" ")
      .pop();

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
export function toggleTimezone() {
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
        // Ensure timestamp is treated as a number if it's a numeric string
        typeof card.dataset.timestamp === "string" &&
          !Number.isNaN(card.dataset.timestamp)
          ? Number(card.dataset.timestamp)
          : card.dataset.timestamp,
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
  );

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
  if (
    window.AlphaStrike &&
    typeof window.AlphaStrike.onLanguageChangeRenderContent === "function"
  ) {
    console.log("ToggleTimezone: Calling page-specific render function.");
    window.AlphaStrike.onLanguageChangeRenderContent();
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
  } else if (typeof timestamp === "string") {
    console.log("As ISO String direct parse:", new Date(timestamp));
  }
  console.log("======================");
}
