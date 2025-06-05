import { searchIncidents, searchTotals } from "./api.js";
import { initializePage } from "./common.js";
import { displayAggregateCard } from "./components/cards.js";
import {
  addIncidentCardListeners,
  createIncidentCard,
  navigateToSearch,
} from "./incidentCard.js";

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
function initializeNavSearch() {
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
      displayAggregateCard(combinedTotals, searchType);
      displaySearchResults(combinedIncidents);
    } else {
      resultsContainer.innerHTML = `<p data-translate="search.noResults">No results found.</p>`;
    }
  } catch (error) {
    console.error("Error fetching search data:", error);
    resultsContainer.innerHTML = `<p data-translate="search.error">Error loading search results.</p>`;
  }

  // Re-apply translations to new dynamic content
  if (typeof setLanguage === "function") {
    const currentLang = localStorage.getItem("preferredLanguage") || "en";
    setLanguage(currentLang);
  }
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
  // Initialize navbar search on all pages
  initializeNavSearch();

  // Only perform search and show results on the search page
  const { query } = getUrlParameters();
  if (query) {
    performSearch(decodeURIComponent(query));
  }

  if (typeof setLanguage === "function") {
    const currentLang = localStorage.getItem("preferredLanguage") || "en";
    setLanguage(currentLang);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializePage("search");
  initializeSearchPage();
});
