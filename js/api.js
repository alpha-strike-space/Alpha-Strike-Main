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
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

/**
 * Fetch recent incidents data
 * @returns {Promise<Incident>} - Array of incident objects
 */
async function fetchRecentIncidents() {
  return await fetchApiData(
    "https://api.alpha-strike.space/incident?filter=month",
  );
}

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

/** Fetch daily totals data
 * @param {string} filter - Optional filter parameter
 * @returns {Promise<TotalsResponse>} - Daily totals data
 */
async function fetchDailyTotals(filter = "day") {
  return await fetchApiData(
    `https://api.alpha-strike.space/totals?filter=${filter}`,
  );
}

/**
 * Search incidents by name or system
 * @param {string} query - Search query
 * @param {string} type - 'name' or 'system'
 * @returns {Promise<Incident>} - Array of search results
 */
async function searchIncidents(query, type) {
  const endpoint =
    type === "system"
      ? `https://api.alpha-strike.space/incident?system=${encodeURIComponent(query)}`
      : `https://api.alpha-strike.space/incident?name=${encodeURIComponent(query)}`;
  return await fetchApiData(endpoint);
}

/**
 * Search totals by name or system
 * @param {string} query - Search query
 * @param {string} type - 'name' or 'system'
 * @returns {Promise<Array>} - Array of total results
 */
async function searchTotals(query, type) {
  const endpoint =
    type === "system"
      ? `https://api.alpha-strike.space/totals?system=${encodeURIComponent(query)}`
      : `https://api.alpha-strike.space/totals?name=${encodeURIComponent(query)}`;
  return await fetchApiData(endpoint);
}
