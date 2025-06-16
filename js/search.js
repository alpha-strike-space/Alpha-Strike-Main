import { setLanguage } from "./translation-dictionary.js";
import { searchIncidents, searchTotals } from "./api.js";
import { displayAggregateCard } from "./components/cards.js";
import {
  addIncidentCardListeners,
  createIncidentCard,
  navigateToSearch,
} from "./incidentCard.js";
import { showLoading, hideLoading } from "./components/loadingOverlay.js";
import { renderPaginationControls } from "./components/pagination.js";

// --- State Management ---
const incidentsPerPage = 20;
let currentPage = 1;
let hasNextPage = false;
let currentQuery = "";
let currentType = "";
let totalIncidents = 0;

/**
 * Get URL parameters for pre-filling search
 */
function getUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    query: urlParams.get("query"),
    type: urlParams.get("type"),
  };
}

/**
 * Initialize navbar search functionality
 */
export function initializeNavSearch() {
  const searchButton = document.getElementById("navSearchBtn");
  const searchInput = document.getElementById("navSearchQuery");
  const searchType = document.getElementById("navSearchType");

  if (!searchButton || !searchInput || !searchType) return;

  searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query === "") {
      alert("Please enter a search query.");
      return;
    }
    navigateToSearch(query, searchType.value);
  });

  searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      searchButton.click();
    }
  });
}

/**
 * Generate case variations of a search query
 * @param {string} query - The original search query
 * @param {string} type - The search type ('name' or 'system')
 * @returns {string[]} Array of case variations
 */
function generateCaseVariations(query, type) {
  if (!query || !query.trim()) return [];
  query = query.trim();
  if (type === "system") return [query.toUpperCase()];

  const lower = query.toLowerCase();
  const upper = query.toUpperCase();
  const firstUpper = query.charAt(0).toUpperCase() + query.slice(1).toLowerCase();

  return [...new Set([query, lower, upper, firstUpper])];
}

/**
 * Display the search results using createIncidentCard from utils.js.
 */
function displaySearchResults(data) {
  const container = document.getElementById("results-container");
  if (!container) return;
  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = `<p data-translate="search.noResults">No search results found.</p>`;
    return;
  }

  data.forEach((item) => {
    const card = createIncidentCard(item);
    if (card) container.appendChild(card);
  });

  addIncidentCardListeners?.();
}

/**
 * Renders the pagination controls, showing them only if needed.
 */
function renderPagination() {
  const paginationContainer = document.getElementById("pagination-container");
  if (!paginationContainer) return;

  if (currentPage > 1 || hasNextPage) {
    paginationContainer.style.display = "flex";
    renderPaginationControls({
      container: paginationContainer,
      currentPage,
      hasNextPage,
      onPageClick: loadPage,
      totalPages: totalIncidents > 0 ? Math.ceil(totalIncidents / incidentsPerPage) : null,
    });
  } else {
    paginationContainer.style.display = "none";
  }
}

/**
 * Fetches and displays a specific page of incident results.
 * This is a wrapper function that handles loading indicators.
 * @param {number} page - The page number to load.
 */
async function loadPage(page) {
  showLoading();
  try {
    await _loadAndDisplayPage(page);

    // After the content is loaded, scroll to the top of the container.
    const resultsContainer = document.getElementById("results-container");
    if (resultsContainer) {
      resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    console.error("Error fetching search page:", error);
    document.getElementById("results-container").innerHTML = `<p data-translate="search.error">Error loading search results.</p>`;
  } finally {
    hideLoading();
    const currentLang = localStorage.getItem("preferredLanguage") || "en";
    setLanguage(currentLang);
  }
}

/**
 * The core recursive logic for loading a page. If a page is empty or fails to load, it tries the one before it.
 * @private
 * @param {number} page - The page number to attempt to load.
 */
async function _loadAndDisplayPage(page) {
  if (page < 1) {
    // Base case for recursion: we've gone below page 1.
    currentPage = 1;
    hasNextPage = false;
    displaySearchResults([]);
    renderPagination();
    return;
  }

  try {
    const offset = (page - 1) * incidentsPerPage;
    const incidents = await searchIncidents(currentQuery, currentType, incidentsPerPage + 1, offset);

    if (incidents.length === 0 && page > 1) {
      // This page is empty, and it's not the first page. Recurse to the previous one.
      await _loadAndDisplayPage(page - 1);
      return;
    }

    // This page has content, or it's page 1 (which might be empty). Display it.
    currentPage = page;
    hasNextPage = incidents.length > incidentsPerPage;
    const incidentsToDisplay = incidents.slice(0, incidentsPerPage);

    displaySearchResults(incidentsToDisplay);
    renderPagination();
  } catch (error) {
    // If fetching fails (e.g., API returns 404 for a large offset), we also treat it
    // as an out-of-bounds page and try the previous one, unless we're on page 1.
    console.warn(`Failed to fetch search page ${page}, trying page ${page - 1}. Error:`, error);
    if (page > 1) {
      await _loadAndDisplayPage(page - 1);
    } else {
      console.error("Error fetching initial search results:", error);
      document.getElementById("results-container").innerHTML = `<p data-translate="search.error">Error loading search results.</p>`;
      currentPage = 1;
      hasNextPage = false;
      renderPagination();
    }
  }
}

/**
 * Performs the initial search, handling case variations and fetching the first page.
 */
async function performInitialSearch(query, type) {
  const resultsContainer = document.getElementById("results-container");
  const totalsCardContainer = document.getElementById("totals-card");
  const paginationContainer = document.getElementById("pagination-container");

  if (!resultsContainer || !totalsCardContainer || !paginationContainer) return;

  // Reset UI for new search
  currentPage = 1;
  totalIncidents = 0;
  resultsContainer.innerHTML = `<p data-translate="search.loading">Loading...</p>`;
  totalsCardContainer.innerHTML = "";
  paginationContainer.style.display = "none";
  showLoading();

  const queryVariations = generateCaseVariations(query, type);
  let successfulVariation = null;
  let initialIncidents = [];
  let totalsData = [];

  for (const variation of queryVariations) {
    try {
      const [totals, incidents] = await Promise.all([
        searchTotals(variation, type),
        searchIncidents(variation, type, incidentsPerPage + 1, 0),
      ]);

      if (incidents?.length > 0) {
        successfulVariation = variation;
        initialIncidents = incidents;
        totalsData = totals || [];
        break;
      }
    } catch (error) {
      /* Continue to next variation */
    }
  }

  hideLoading();

  if (successfulVariation) {
    currentQuery = successfulVariation;
    currentType = type;

    if (totalsData && totalsData.length > 0) {
      const aggregateData = totalsData[0];
      if (type === "system") {
        totalIncidents = aggregateData.incident_count || 0;
      } else {
        totalIncidents =
          (aggregateData.total_kills || 0) + (aggregateData.total_losses || 0);
      }
    }

    // Display aggregate card
    await displayAggregateCard(totalsData, type);

    // Display first page of incidents
    hasNextPage = initialIncidents.length > incidentsPerPage;
    const incidentsToDisplay = initialIncidents.slice(0, incidentsPerPage);
    displaySearchResults(incidentsToDisplay);
    renderPagination();
  } else {
    resultsContainer.innerHTML = `<p data-translate="search.noResults">No results found for your query.</p>`;
  }

  const currentLang = localStorage.getItem("preferredLanguage") || "en";
  setLanguage(currentLang);
}

/**
 * Initialize search page functionality
 */
export function initializeSearchPage() {
  const { query, type } = getUrlParameters();
  if (query) {
    performInitialSearch(decodeURIComponent(query), type || "name");
  }
}
