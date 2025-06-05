/**
 * Import type definitions
 */
import "./types/api-types/Incidents.js";
import "./types/api-types/Totals.js";
import "./types/api-types/Location.js";

/**
 * Base API utilities
 */

/**
 * Generic API fetch function with error handling
 * @param {string} url - The API endpoint URL
 * @returns {Promise<Object>} - The JSON response
 */
async function fetchApiData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // Log the response data for debugging
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

/**
 * Health Check Endpoints
 */

/**
 * Check server health status
 * @returns {Promise<Object>} - Server health status
 */
async function checkServerHealth() {
  return await fetchApiData("https://api.alpha-strike.space/health");
}

/**
 * Incident Endpoints
 */

/**
 * Fetch recent incidents data
 * @returns {Promise<Incident[]>} - Array of incident objects
 */
async function fetchRecentIncidents() {
  return await fetchApiData(
    "https://api.alpha-strike.space/incident?filter=month",
  );
}

/**
 * Fetch a single incident by its mail_id
 * @param {string} mail_id - The ID of the killmail
 * @returns {Promise<Incident>} - An incident object
 */
async function fetchIncidentById(mail_id) {
  return await fetchApiData(
    `https://api.alpha-strike.space/incident?mail_id=${mail_id}`,
  );
}

/**
 * Search incidents by name or system
 * @param {string} query - Search query
 * @param {string} type - 'name' or 'system'
 * @returns {Promise<Incident[]>} - Array of search results
 */
async function searchIncidents(query, type) {
  const endpoint =
    type === "system"
      ? `https://api.alpha-strike.space/incident?system=${encodeURIComponent(query)}`
      : `https://api.alpha-strike.space/incident?name=${encodeURIComponent(query)}`;
  return await fetchApiData(endpoint);
}

/**
 * Location Endpoints
 */

/**
 * Fetch location data by system
 * @param {string} system - System name or ID
 * @returns {Promise<LocationResponse>} - Array of location data
 */
async function fetchLocationBySystem(system) {
  return await fetchApiData(
    `https://api.alpha-strike.space/location?system=${encodeURIComponent(system)}`,
  );
}

/**
 * Totals Endpoints
 */

/**
 * Fetch monthly totals data
 * @param {string} filter - Optional filter parameter
 * @returns {Promise<TotalsResponse>} - Monthly totals data
 */
async function fetchMonthlyTotals(filter = "month") {
  return await fetchApiData(
    `https://api.alpha-strike.space/totals?filter=${filter}`,
  );
}

/**
 * Fetch weekly totals data
 * @param {string} filter - Optional filter parameter
 * @returns {Promise<TotalsResponse>} - Weekly totals data
 */
async function fetchWeeklyTotals(filter = "week") {
  return await fetchApiData(
    `https://api.alpha-strike.space/totals?filter=${filter}`,
  );
}

/**
 * Fetch daily totals data
 * @param {string} filter - Optional filter parameter
 * @returns {Promise<TotalsResponse>} - Daily totals data
 */
async function fetchDailyTotals(filter = "day") {
  return await fetchApiData(
    `https://api.alpha-strike.space/totals?filter=${filter}`,
  );
}

/**
 * Search totals by name or system
 * @param {string} query - Search query
 * @param {string} type - 'name' or 'system'
 * @returns {Promise<TotalsResponse[]>} - Array of total results
 */
async function searchTotals(query, type) {
  const endpoint =
    type === "system"
      ? `https://api.alpha-strike.space/totals?system=${encodeURIComponent(query)}`
      : `https://api.alpha-strike.space/totals?name=${encodeURIComponent(query)}`;
  return await fetchApiData(endpoint);
}

// Export all functions
export {
  // Base utilities
  fetchApiData,
  // Health check
  checkServerHealth,
  // Incident endpoints
  fetchRecentIncidents,
  fetchIncidentById,
  searchIncidents,
  // Location endpoints
  fetchLocationBySystem,
  // Totals endpoints
  fetchMonthlyTotals,
  fetchWeeklyTotals,
  fetchDailyTotals,
  searchTotals,
};
