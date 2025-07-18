import {
  setLanguage,
  applyTranslationsToElement,
  languages,
  currentLanguageIndex,
} from "./translation-dictionary.js";
import {
  searchBareIncidents,
  enrichIncident,
  searchTotals,
  fetchSmartCharacterByAddress,
} from "./api.js";
import { displayAggregateCard } from "./components/cards.js";
import {
  addIncidentCardListeners,
  createIncidentCard,
  navigateToSearch,
} from "./incidentCard.js";
import {
  showInlineLoader,
  hideInlineLoader,
} from "./components/inline-loader.js";
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
  const firstUpper =
    query.charAt(0).toUpperCase() + query.slice(1).toLowerCase();

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
  const resultsContainer = document.getElementById("results-container");
  showInlineLoader(resultsContainer, "Loading Incidents...");
  try {
    await _loadAndDisplayPage(page);

    // After the content is loaded, scroll to the top of the container.
    if (resultsContainer) {
      resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    console.error("Error fetching search page:", error);
    resultsContainer.innerHTML = `<p data-translate="search.error">Error loading search results.</p>`;
  } finally {
    hideInlineLoader(resultsContainer);
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
    const resultsContainer = document.getElementById("results-container");
    resultsContainer.innerHTML =
      '<p data-translate="search.noResults">No search results found.</p>';
    applyTranslationsToElement(
      resultsContainer,
      languages[currentLanguageIndex],
    );
    renderPagination();
    return;
  }

  const resultsContainer = document.getElementById("results-container");

  try {
    const offset = (page - 1) * incidentsPerPage;
    const bareIncidents = await searchBareIncidents(
      currentQuery,
      currentType,
      incidentsPerPage + 1,
      offset,
    );

    if (bareIncidents.length === 0 && page > 1) {
      // This page is empty, and it's not the first page. Recurse to the previous one.
      await _loadAndDisplayPage(page - 1);
      return;
    }

    // This is a new page load, clear the container.
    resultsContainer.innerHTML = "";

    // This page has content, or it's page 1 (which might be empty). Display it.
    currentPage = page;
    hasNextPage = bareIncidents.length > incidentsPerPage;
    const incidentsToProcess = bareIncidents.slice(0, incidentsPerPage);

    if (incidentsToProcess.length === 0) {
      resultsContainer.innerHTML =
        '<p data-translate="search.noResults">No search results found.</p>';
      // Ensure the "no results" message is translated
      applyTranslationsToElement(resultsContainer, languages[currentLanguageIndex]);
    } else {
      const processingPromises = incidentsToProcess.map(async (incident) => {
        const enriched = await enrichIncident(incident);
        const card = createIncidentCard(enriched);
        if (card) {
          resultsContainer.appendChild(card);
          addIncidentCardListeners(card);
          applyTranslationsToElement(card, languages[currentLanguageIndex]);
        }
      });
      await Promise.all(processingPromises);
    }

    renderPagination();
  } catch (error) {
    // If fetching fails (e.g., API returns 404 for a large offset), we also treat it
    // as an out-of-bounds page and try the previous one, unless we're on page 1.
    console.warn(
      `Failed to fetch search page ${page}, trying page ${page - 1}. Error:`,
      error,
    );
    if (page > 1) {
      await _loadAndDisplayPage(page - 1);
    } else {
      console.error("Error fetching initial search results:", error);
      resultsContainer.innerHTML = `<p data-translate="search.error">Error loading search results.</p>`;
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
  showInlineLoader(resultsContainer, "Searching...");
  totalsCardContainer.innerHTML = "";
  paginationContainer.style.display = "none";

  const queryVariations = generateCaseVariations(query, type);
  let successfulVariation = null;
  let initialBareIncidents = [];
  let totalsData = [];

  for (const variation of queryVariations) {
    try {
      const [totals, incidents] = await Promise.all([
        searchTotals(variation, type),
        searchBareIncidents(variation, type, incidentsPerPage + 1, 0),
      ]);

      if (incidents?.length > 0) {
        successfulVariation = variation;
        initialBareIncidents = incidents;
        totalsData = totals || [];
        break;
      }
    } catch (error) {
      /* Continue to next variation */
    }
  }

  hideInlineLoader(resultsContainer);

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

        // Try to fetch a portrait from the first incident for the aggregate card
        if (type === "name" && initialBareIncidents?.length > 0) {
          const firstIncident = initialBareIncidents[0];
          let characterAddress = null;

          // Determine the address of the searched character from the incident
          if (
            firstIncident.killer_name?.toLowerCase() ===
            successfulVariation.toLowerCase()
          ) {
            characterAddress = firstIncident.killer_address;
          } else if (
            firstIncident.victim_name?.toLowerCase() ===
            successfulVariation.toLowerCase()
          ) {
            characterAddress = firstIncident.victim_address;
          }

          if (characterAddress) {
            try {
              const character =
                await fetchSmartCharacterByAddress(characterAddress);
              if (character?.portraitUrl) {
                aggregateData.portraitUrl = character.portraitUrl;
              }
            } catch (error) {
              console.warn(
                `Could not fetch portrait for ${characterAddress}`,
                error,
              );
            }
          }
        }
      }
    }

    // Display aggregate card and clear results for streaming
    await displayAggregateCard(totalsData, type);
    resultsContainer.innerHTML = ""; // Clear for streaming

    // Stream the first page of incidents
    hasNextPage = initialBareIncidents.length > incidentsPerPage;
    const incidentsToProcess = initialBareIncidents.slice(
      0,
      incidentsPerPage,
    );

    if (incidentsToProcess.length > 0) {
      const processingPromises = incidentsToProcess.map(async (incident) => {
        const enriched = await enrichIncident(incident);
        const card = createIncidentCard(enriched);
        if (card) {
          resultsContainer.appendChild(card);
          addIncidentCardListeners(card);
          applyTranslationsToElement(card, languages[currentLanguageIndex]);
        }
      });
      await Promise.all(processingPromises);
    }

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
