import { initializePage, displayDataInContainer } from "./common.js";
import { fetchRecentIncidents } from "./api.js";
import { toggleTimezone } from "./utils.js";
import { createIncidentCard } from "./incidentCard.js";
import { WebSocketManager } from "./websocket.js";
import {
  showLoading,
  hideLoading,
} from "./components/loadingOverlay.js";
import { renderPaginationControls } from "./components/pagination.js";

const incidentsPerPage = 20;
let currentPage = 1;
let hasNextPage = false;

/**
 * Fetches and displays a specific page of incidents.
 * This is a wrapper function that handles loading indicators.
 * @param {number} page - The page number to load.
 */
async function loadIncidents(page) {
  showLoading();
  try {
    await _loadAndDisplayIncidents(page);

    // After the content is loaded, scroll to the top of the container.
    const dataContainer = document.getElementById("data-container");
    if (dataContainer) {
      dataContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    // This catch block will now only handle truly unexpected errors,
    // as page-loading errors are handled recursively.
    console.error("An unexpected error occurred:", error);
    document.getElementById("data-container").textContent = "An error occurred while loading data.";
  } finally {
    hideLoading();
  }
}

/**
 * The core recursive logic for loading a page of incidents.
 * It gracefully handles pages that are out-of-bounds or fail to load by trying the previous page.
 * @private
 * @param {number} page - The page number to attempt to load.
 */
async function _loadAndDisplayIncidents(page) {
  if (page < 1) {
    // We've recursed below page 1, which means no incidents were found.
    currentPage = 1;
    hasNextPage = false;
    displayDataInContainer([], "data-container", createIncidentCard, {
      noDataMessage: "No recent incidents found.",
    });
    renderPagination();
    return;
  }

  try {
    const offset = (page - 1) * incidentsPerPage;
    const data = await fetchRecentIncidents(incidentsPerPage + 1, offset);

    // If we get an empty array for a page greater than 1, it means we've gone too far.
    // So, we recursively try to load the previous page.
    if (data.length === 0 && page > 1) {
      await _loadAndDisplayIncidents(page - 1);
      return;
    }

    // Otherwise, we have a valid page (even if it's page 1 and empty).
    currentPage = page;
    hasNextPage = data.length > incidentsPerPage;
    const incidentsToDisplay = data.slice(0, incidentsPerPage);

    displayDataInContainer(
      incidentsToDisplay,
      "data-container",
      createIncidentCard,
      {
        sortBy: "time_stamp",
        sortDirection: "desc",
        noDataMessage: "No recent incidents found.",
      },
    );
    renderPagination();
  } catch (error) {
    // If fetching fails (e.g., API returns 404 for a large offset), we also treat it
    // as an out-of-bounds page and try the previous one, unless we're on page 1.
    console.warn(`Failed to fetch page ${page}, trying page ${page - 1}. Error:`, error);
    if (page > 1) {
      await _loadAndDisplayIncidents(page - 1);
    } else {
      // If fetching page 1 fails, we have a genuine problem.
      console.error("Error fetching initial incidents:", error);
      document.getElementById("data-container").textContent = "Failed to load data.";
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