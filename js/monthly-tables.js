import {
  fetchDailyTotals,
  fetchMonthlyTotals,
  fetchWeeklyTotals,
} from "./api.js";
import { setLanguage, translations } from "./translation-dictionary.js";
import { navigateToSearch } from "./incidentCard.js";
import { showLoading, hideLoading } from "./components/loadingOverlay.js";

export function updateRollingAverageHeaderText(timeRange) {
  const rollingHeader = document.getElementById("rollingAverageHeader");
  if (rollingHeader && timeRange) {
    let headerText = `Rolling ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Average`; // Default English
    const headerKey = `header.rolling${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`; // e.g., header.rollingDay

    const preferredLang = localStorage.getItem("preferredLanguage") || "en";
    if (
      typeof translations !== "undefined" &&
      translations[headerKey]?.[preferredLang]
    ) {
      headerText = translations[headerKey][preferredLang];
    } else if (
      typeof translations !== "undefined" &&
      translations[headerKey]?.en
    ) {
      headerText = translations[headerKey].en;
    }
    // If translations object itself is undefined or key completely missing, headerText remains the default English.

    rollingHeader.textContent = headerText;
    console.log(
      `Rolling average header updated via updateRollingAverageHeaderText for timeRange: ${timeRange}`,
    );
  } else {
    if (!rollingHeader)
      console.warn(
        "updateRollingAverageHeaderText: rollingAverageHeader element not found.",
      );
    if (!timeRange)
      console.warn(
        "updateRollingAverageHeaderText: timeRange parameter is missing.",
      );
  }
}

/**
 * Fetches the totals data from the API for a specific time range and renders the appropriate metric, with caching.
 * @param {string} metric - One of "top_systems", "top_killers", or "top_victims"
 * @param {string} tableId - The ID of the table element to display the data in.
 * @param {string} timeRange - The time range for the filter ('day', 'week', 'month'). Default is 'month'.
 */
export async function fetchAndDisplayMetric(
  metric,
  tableId,
  timeRange = "month",
) {
  const CACHE_KEY_PREFIX = "totals_"; // Updated prefix
  const CACHE_DURATION_MS = {
    // Different durations for different ranges
    day: 5 * 60 * 1000, // 5 minutes for daily
    week: 30 * 60 * 1000, // 30 minutes for weekly
    month: 60 * 60 * 1000, // 1 hour for monthly
  };

  const cacheKey = `${CACHE_KEY_PREFIX}${timeRange}_${metric}`;
  const cacheDuration = CACHE_DURATION_MS[timeRange] || CACHE_DURATION_MS.month; // Fallback to month's duration

  const dataContainer = document.getElementById("data-container");
  const table = document.getElementById(tableId);
  const tableBody = table ? table.querySelector("tbody") : null;

  if (!table || !tableBody) {
    console.error(`Table or table body not found for ID: ${tableId}.`);
    if (dataContainer) {
      dataContainer.textContent = "Error: UI elements missing."; // Consider making this translatable
    }
    return;
  }

  if (table) table.style.display = "none"; // Hide the table initially

  if (dataContainer) {
    const preferredLang = localStorage.getItem("preferredLanguage") || "en";
    const loadingText =
      translations["loading.data"]?.[preferredLang] || "Loading data...";
    dataContainer.innerHTML = `<p data-translate="loading.data">${loadingText}</p>`;
  }

  // updateActiveButtonStates(timeRange); // Helper to update UI button states
  showLoading();
  // Try to load from cache first
  try {
    const cachedItem = localStorage.getItem(cacheKey);
    if (cachedItem) {
      const { timestamp, data } = JSON.parse(cachedItem);
      if (Date.now() - timestamp < cacheDuration) {
        console.log(
          `Using cached data for metric: ${metric}, timeRange: ${timeRange}`,
        );
        const metricData = data[metric];
        // displayMetricDataInTable is the helper from the previous caching example
        displayMetricDataInTable(
          metricData,
          table,
          tableBody,
          metric,
          dataContainer,
          timeRange,
        );
        hideLoading();
        return;
      }
      console.log(
        `Cache expired for metric: ${metric}, timeRange: ${timeRange}`,
      );
      localStorage.removeItem(cacheKey);
    }
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    hideLoading();
  }


  // If not in cache or cache expired, fetch from API
  try {
    let apiData;
    // Call the correct fetch function based on timeRange
    if (timeRange === "day") {
      apiData = await fetchDailyTotals(); // from js/api.js
    } else if (timeRange === "week") {
      apiData = await fetchWeeklyTotals(); // from js/api.js
    } else {
      // Default to month
      apiData = await fetchMonthlyTotals(); // from js/api.js
    }

    if (!apiData || typeof apiData !== "object" || !apiData[metric]) {
      // Added typeof apiData check
      console.error(
        `No data returned or invalid structure for metric: ${metric} in API response:`,
        apiData,
      );
      const preferredLang = localStorage.getItem("preferredLanguage") || "en";
      const noDataText =
        translations["error.noData"]?.[preferredLang] ||
        `No data available for metric: ${metric}`;
      if (dataContainer) {
        dataContainer.innerHTML = `<p data-translate="error.noData">${noDataText}</p>`;
      }
      if (table) table.style.display = "none"; // Ensure table is hidden if no data
      hideLoading();
      return;
    }

    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ timestamp: Date.now(), data: apiData }),
      );
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }

    const metricData = apiData[metric];
    displayMetricDataInTable(
      metricData,
      table,
      tableBody,
      metric,
      dataContainer,
      timeRange,
    );
  } catch (error) {
    console.error(`Error fetching data for metric: ${metric}`, error);
    const preferredLang = localStorage.getItem("preferredLanguage") || "en";
    const errorText =
      translations["error.loadFailed"]?.[preferredLang] ||
      "Failed to load data.";
    if (dataContainer) {
      dataContainer.innerHTML = `<p data-translate="error.loadFailed">${errorText}</p>`;
    }
    if (table) table.style.display = "none"; // Ensure table is hidden on error
  }
  hideLoading();
}

/**
 * Helper function to display metric data in the table.
 * (Slightly modified to accept timeRange for context if needed, and update table header)
 */
export function displayMetricDataInTable(
  metricData,
  table,
  tableBody,
  metric,
  dataContainer,
  timeRange,
) {
  const rollingHeader = document.getElementById("rollingAverageHeader"); // You'll need to add this ID to your H1
  if (rollingHeader) {
    // This part needs new translation keys as well if you want it localized.
    // e.g., "header.rollingDaily", "header.rollingWeekly", "header.rollingMonthly"
    let headerText = `Rolling ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Average`;
    const headerKey = `header.rolling${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`; // e.g. header.rollingDay

    // Attempt to translate
    const preferredLang = localStorage.getItem("preferredLanguage") || "en";
    if (
      typeof translations !== "undefined" &&
      translations[headerKey]?.[preferredLang]
    ) {
      headerText = translations[headerKey][preferredLang];
    } else if (
      typeof translations !== "undefined" &&
      translations[headerKey]?.en
    ) {
      // Fallback to English from translations object
      headerText = translations[headerKey].en;
    }
    // If you're using data-translate attribute:
    // rollingHeader.setAttribute('data-translate', headerKey);
    // And then call setLanguage()
    // For direct text:
    rollingHeader.textContent = headerText;
  }

  if (dataContainer) {
    dataContainer.textContent = "";
  }
  table.style.display = "table";
  tableBody.innerHTML = "";

  if (metricData && Array.isArray(metricData) && metricData.length > 0) {
    // ... (rest of the table population logic remains the same as your previous caching example) ...
    // Make sure it correctly uses item.kills, item.losses, item.incident_count
    // as per your data structure
    [...metricData].map((item) => {
      const tr = document.createElement("tr");
      let nameCellContent = "";
      let valueCellContent = "";

      if (metric === "top_systems") {
        const systemName = item.solar_system_name || "UNKNOWN";
        nameCellContent = `<span class="clickable-system" data-system="${systemName}" title="Click to search for ${systemName}">${systemName}<i class="fa-sharp fa-solid fa-arrow-up-right-from-square"></i></span>`;
        valueCellContent = item.incident_count || item.kills;
      } else if (metric === "top_killers") {
        const killerName = item.name || "UNKNOWN";
        nameCellContent = `<span class="clickable-name" data-name="${killerName}" title="Click to search for ${killerName}">${killerName}<i class="fa-sharp fa-solid fa-arrow-up-right-from-square"></i></span>`;
        valueCellContent = item.kills;
      } else if (metric === "top_victims") {
        const victimName = item.name || "UNKNOWN";
        nameCellContent = `<span class="clickable-name" data-name="${victimName}" title="Click to search for ${victimName}">${victimName}<i class="fa-sharp fa-solid fa-arrow-up-right-from-square"></i></span>`;
        valueCellContent = item.losses;
      }

      tr.innerHTML = `
                <td>${nameCellContent}</td>
                <td>${valueCellContent}</td>
            `;
      tableBody.appendChild(tr);
    });
  } else {
    if (dataContainer) {
      dataContainer.innerHTML = `<p data-translate="error.noData">${
        translations["error.noData"]?.[
          localStorage.getItem("preferredLanguage") || "en"
        ] || "No data available for this metric."
      }</p>`;
      table.style.display = "none";
    }
  }
  addTableClickListeners(table.id);
  if (typeof setLanguage === "function") {
    // Ensure dynamic content is re-translated
    setLanguage(localStorage.getItem("preferredLanguage") || "en");
  }
}

/**
 * Add click event listeners to table cells for navigation.
 * This should be called after the table is populated.
 * @param {string} tableId - The ID of the table to add listeners to.
 */
export function addTableClickListeners(tableId) {
  const table = document.getElementById(tableId);
  if (!table) {
    console.error(`Table with ID ${tableId} not found.`);
    return;
  }

  // Add listeners for clickable names
  [...table.querySelectorAll(".clickable-name")].map((element) => {
    element.style.cursor = "pointer"; // Add pointer cursor
    element.addEventListener("click", (e) => {
      e.preventDefault();
      const name = element.dataset.name;
      if (
        name &&
        name !== "UNKNOWN" &&
        typeof navigateToSearch === "function"
      ) {
        navigateToSearch(name, "name");
      } else if (typeof navigateToSearch !== "function") {
        console.error(
          "navigateToSearch function is not defined. Make sure utils.js is loaded.",
        );
      }
    });
  });

  // Add listeners for clickable systems
  [...table.querySelectorAll(".clickable-system")].map((element) => {
    element.style.cursor = "pointer"; // Add pointer cursor
    element.addEventListener("click", (e) => {
      e.preventDefault();
      const system = element.dataset.system;
      if (
        system &&
        system !== "UNKNOWN" &&
        typeof navigateToSearch === "function"
      ) {
        navigateToSearch(system, "system");
      } else if (typeof navigateToSearch !== "function") {
        console.error(
          "navigateToSearch function is not defined. Make sure utils.js is loaded.",
        );
      }
    });
  });
}

// // Helper function to update active button states
// export function updateActiveButtonStates(activeTimeRange) {
//   const buttons = document.querySelectorAll(".time-range-btn");
//   [...buttons].map((button) => {
//     if (button.dataset.timeRange === activeTimeRange) {
//       button.classList.add("active");
//     } else {
//       button.classList.remove("active");
//     }
//   });
// }
