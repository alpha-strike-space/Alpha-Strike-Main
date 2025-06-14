import { setLanguage } from "./translation-dictionary.js";
import { searchIncidents, searchTotals } from "./api.js";
import { displayAggregateCard } from "./components/cards.js";
import {
  addIncidentCardListeners,
  createIncidentCard,
  navigateToSearch,
} from "./incidentCard.js";
import { showLoading, hideLoading } from "./components/loadingOverlay.js";

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
  // If query is empty or only whitespace, return empty array
  if (!query || !query.trim()) return [];

  // Remove any extra whitespace
  query = query.trim();

  // For system queries, only use uppercase
  if (type === "system") {
    return [query.toUpperCase()];
  }

  // For character names, use three different capitalizations
  // If the query is already lowercase, we'll create variations by capitalizing different parts
  if (query === query.toLowerCase()) {
    return [
      query, // Original (lowercase)
      query.toUpperCase(), // All uppercase
      query.charAt(0).toUpperCase() + query.slice(1), // First letter capitalized
    ];
  }

  // If the query is already uppercase, we'll create variations by lowercasing different parts
  if (query === query.toUpperCase()) {
    return [
      query, // Original (uppercase)
      query.toLowerCase(), // All lowercase
      query.charAt(0).toLowerCase() + query.slice(1), // First letter lowercase
    ];
  }

  // For mixed case, use the standard variations
  return [
    query, // Original
    query.toLowerCase(), // All lowercase
    query.toUpperCase(), // All uppercase
  ];
}

/**
 * Performs two API calls concurrently:
 *   1. Incident search (detailed stamped mail results)
 *   2. Aggregated totals (all time totals) from a different URL.
 */
async function performSearch(query) {
  const { type } = getUrlParameters();
  const searchType = type || "name";

  const resultsContainer = document.getElementById("results-container");
  const totalsCardContainer = document.getElementById("totals-card");

  if (!resultsContainer || !totalsCardContainer) return;

  resultsContainer.innerHTML =
    '<p data-translate="search.loading">Loading...</p>';
  totalsCardContainer.innerHTML = "";

  showLoading();

  try {
    // Generate case variations of the search query
    const queryVariations = generateCaseVariations(query, searchType);

    // Try each variation sequentially until we get results
    let combinedIncidents = [];
    let combinedTotals = [];

    for (const variation of queryVariations) {
      try {
        const [incidents, totals] = await Promise.all([
          searchIncidents(variation, searchType),
          searchTotals(variation, searchType),
        ]);

        // If we got results, use them and break the loop
        if (incidents && incidents.length > 0) {
          combinedIncidents = incidents;
          combinedTotals = totals || [];
          break;
        }
      } catch (error) {
        // Continue to next variation
      }
    }

    // Display results if we found any
    if (combinedIncidents.length > 0) {
      // Enrich the totals data with the character address from the incidents list
      if (
        searchType === "name" &&
        combinedTotals.length > 0 &&
        combinedIncidents.length > 0
      ) {
        const characterName = combinedTotals[0].name;
        const matchingIncident = combinedIncidents.find(
          (inc) =>
            inc.killer_name === characterName ||
            inc.victim_name === characterName,
        );
        if (matchingIncident) {
          combinedTotals[0].character_address =
            matchingIncident.killer_name === characterName
              ? matchingIncident.killer_address
              : matchingIncident.victim_address;
        }
      }

      await displayAggregateCard(combinedTotals, searchType);
      displaySearchResults(combinedIncidents);
    } else {
      resultsContainer.innerHTML = `<p data-translate="search.noResults">No results found.</p>`;
    }
  } catch (error) {
    console.error("Error fetching search data:", error);
    resultsContainer.innerHTML = `<p data-translate="search.error">Error loading search results.</p>`;
  }

  // Re-apply translations to new dynamic content
  const currentLang = localStorage.getItem("preferredLanguage") || "en";
  setLanguage(currentLang);
  hideLoading();
}

/**
 * Display the search results using createIncidentCard from utils.js.
 */
function displaySearchResults(data) {
  const container = document.getElementById("results-container");
  if (!container) return;

  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = `<p data-translate="search.noResults">No results found.</p>`;
    return;
  }

  data.forEach((item) => {
    const card = createIncidentCard(item);
    if (card) {
      container.appendChild(card);
    }
  });

  if (typeof addIncidentCardListeners === "function") {
    addIncidentCardListeners();
  }
}

/**
 * Initialize search page functionality
 */
export function initializeSearchPage() {
  // Only perform search and show results on the search page
  const { query } = getUrlParameters();
  if (query) {
    performSearch(decodeURIComponent(query));
  }
}
