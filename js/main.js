import { initializePage, displayDataInContainer } from "./common.js";
import { fetchBareIncidents, enrichIncident } from "./api.js";
import { toggleTimezone } from "./utils.js";
import { createIncidentCard, addIncidentCardListeners } from "./incidentCard.js";
import { WebSocketManager } from "./websocket.js";
import {
  showInlineLoader,
  hideInlineLoader,
} from "./components/inline-loader.js";
import { renderPaginationControls } from "./components/pagination.js";
import {
  initializeLanguageSwitcher,
  languages,
  setLanguage,
  applyTranslationsToElement,
  currentLanguageIndex,
} from "./translation-dictionary.js";

const incidentsPerPage = 20;
let currentPage = 1;
let hasNextPage = false;

/**
 * Fetches and displays a specific page of incidents.
 * This is a wrapper function that handles loading indicators.
 * @param {number} page - The page number to load.
 */
async function loadIncidents(page) {
  const dataContainer = document.getElementById("data-container");
  try {
    // Show loader before starting the operation.
    // _loadAndDisplayIncidents will be responsible for clearing it or replacing it with content.
    showInlineLoader(dataContainer, "Loading Incidents...");
    await _loadAndDisplayIncidents(page);

    // After the content is loaded, scroll to the top of the container.
    if (dataContainer) {
      dataContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    // This catch block will now only handle truly unexpected errors,
    // as page-loading errors are handled recursively.
    console.error("An unexpected error occurred:", error);
    if (dataContainer) {
      dataContainer.textContent = "An error occurred while loading data.";
    }
  }
}

/**
 * The core recursive logic for loading a page of incidents.
 * It gracefully handles pages that are out-of-bounds or fail to load by trying the previous page.
 * @private
 * @param {number} page - The page number to attempt to load.
 */
async function _loadAndDisplayIncidents(page) {
  const dataContainer = document.getElementById("data-container");

  if (page < 1) {
    // We've recursed below page 1, which means no incidents were found.
    currentPage = 1;
    hasNextPage = false;
    if (dataContainer) {
      // Clear the loader before showing the no-data message
      dataContainer.innerHTML = "";
      displayDataInContainer([], "data-container", createIncidentCard, {
        noDataMessage: "No recent incidents found.",
      });
    }
    renderPagination();
    return;
  }

  try {
    const offset = (page - 1) * incidentsPerPage;
    // Fetch only the bare incident data first
    const bareIncidents = await fetchBareIncidents(
      incidentsPerPage + 1,
      offset,
    );

    // If we get an empty array for a page greater than 1, it means we've gone too far.
    if (bareIncidents.length === 0 && page > 1) {
      await _loadAndDisplayIncidents(page - 1); // Recursively try the previous page
      return;
    }

    // Clear the container (which may have the loader) before adding new cards
    dataContainer.innerHTML = "";

    currentPage = page;
    hasNextPage = bareIncidents.length > incidentsPerPage;
    const incidentsToProcess = bareIncidents.slice(0, incidentsPerPage);

    if (incidentsToProcess.length === 0) {
      displayDataInContainer([], "data-container", createIncidentCard, {
        noDataMessage: "No recent incidents found.",
      });
      renderPagination();
      return;
    }

    // Process each incident individually and append it to the container as it's ready.
    const processingPromises = incidentsToProcess.map(async (incident) => {
      try {
        const enrichedIncident = await enrichIncident(incident);
        const card = createIncidentCard(enrichedIncident);
        if (card) {
          dataContainer.appendChild(card);
          addIncidentCardListeners(card); // Add listeners to the newly created card
          // Apply translations to the new card
          applyTranslationsToElement(card, languages[currentLanguageIndex]);
        }
      } catch (error) {
        console.error("Error processing incident:", incident.id, error);
        // Optionally, display a placeholder for the failed card
      }
    });

    // Wait for all incidents to be processed before rendering pagination
    await Promise.all(processingPromises);
    renderPagination();
  } catch (error) {
    console.warn(
      `Failed to fetch page ${page}, trying page ${page - 1}. Error:`,
      error,
    );
    if (page > 1) {
      await _loadAndDisplayIncidents(page - 1);
    } else {
      console.error("Error fetching initial incidents:", error);
      document.getElementById("data-container").textContent =
        "Failed to load data.";
      currentPage = 1;
      hasNextPage = false;
      renderPagination();
    }
  }
}

function renderPagination() {
  const paginationContainer = document.getElementById("pagination-container");
  renderPaginationControls({
    container: paginationContainer,
    currentPage,
    hasNextPage,
    onPageClick: loadIncidents,
  });
}

// Page-specific initialization
document.addEventListener("DOMContentLoaded", async () => {
  initializePage("home");

  await loadIncidents(1);

  // Initialize WebSocket for live updates
  const wsManager = new WebSocketManager(
    "wss://api.alpha-strike.space/ws/mails",
    "data-container"
  );
  wsManager.connect();
}); 