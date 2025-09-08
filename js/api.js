/**
 * Import type definitions
 */
import "./types/api-types/Incidents.js";
import "./types/api-types/Totals.js";
import "./types/api-types/Location.js";
import "./types/api-types/SmartCharacter.js";

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
 * Character Endpoints
 */
const worldApiBaseUrl = "https://world-api-stillness.live.tech.evefrontier.com";

/**
 * Fetches a single smart character by its address from the World API.
 * This function first finds the character's ID by their address,
 * then fetches the full character details.
 * @param {string} characterAddress The address of the smart character.
 * @returns {Promise<SmartCharacter|null>} A promise that resolves to the smart character data, or null if not found.
 */
async function fetchSmartCharacterByAddress(characterAddress) {
  if (!characterAddress) {
    return Promise.resolve(null);
  }

  const url = `${worldApiBaseUrl}/v2/smartcharacters/${characterAddress}`;
  try {
    const response = await fetchApiData(url);
    if (response) {
      // The endpoint returns the character object directly.
      return response;
    }
    return null;
  } catch (error) {
    console.error(
      `Error fetching smart character by address ${characterAddress}:`,
      error,
    );
    return null;
  }
}

/**
 * Fetches a single smart character by its ID from the World API.
 * The response from the API is expected to include a `portraitUrl`.
 * @param {string} characterId The ID of the smart character.
 * @returns {Promise<SmartCharacter|null>} A promise that resolves to the smart character data, or null if no ID is provided.
 */
async function fetchSmartCharacterById(characterId) {
  if (!characterId) {
    return Promise.resolve(null);
  }
  const url = `${worldApiBaseUrl}/v2/smartcharacters/${characterId}`;
  return await fetchApiData(url);
}

/**
 * Enriches a single incident with character data (portraits, IDs).
 * @param {Incident} incident - The bare incident object.
 * @returns {Promise<Incident>} - The enriched incident object.
 */
export async function enrichIncident(incident) {
  const killerPromise = fetchSmartCharacterByAddress(incident.killer_address);
  const victimPromise = fetchSmartCharacterByAddress(incident.victim_address);
  const [killer, victim] = await Promise.all([killerPromise, victimPromise]);
  return {
    ...incident,
    killer_id: killer ? killer.id : null,
    victim_id: victim ? victim.id : null,
    killer_portrait_url: killer ? killer.portraitUrl : null,
    victim_portrait_url: victim ? victim.portraitUrl : null,
  };
}

/**
 * Incident Endpoints
 */

/**
 * Fetches recent incidents from the API without enrichment.
 * @param {number} limit - The number of incidents to fetch.
 * @param {number} offset - The starting point for fetching incidents.
 * @returns {Promise<Incident[]>} - Array of bare incident objects.
 */
export async function fetchBareIncidents(limit = 20, offset = 0) {
  const incidents = await fetchApiData(
    `https://api.alpha-strike.space/incident?filter=month&limit=${limit}&offset=${offset}`,
  );

  if (!incidents || !Array.isArray(incidents)) {
    return [];
  }
  return incidents;
}

/**
 * Fetch recent incidents data
 * @param {number} limit - The number of incidents to fetch.
 * @param {number} offset - The starting point for fetching incidents.
 * @returns {Promise<Incident[]>} - Array of incident objects
 */
async function fetchRecentIncidents(limit = 20, offset = 0) {
  const incidents = await fetchApiData(
    `https://api.alpha-strike.space/incident?filter=month&limit=${limit}&offset=${offset}`,
  );

  if (!incidents || !Array.isArray(incidents)) {
    return [];
  }

  // Enrich incidents with character data
  const enrichedIncidents = await Promise.all(
    incidents.map(async (incident) => {
      return await enrichIncident(incident);
    }),
  );

  return enrichedIncidents;
}

/**
 * Fetch a single incident by its mail_id
 * @param {string} mail_id - The ID of the killmail
 * @returns {Promise<Incident>} - An incident object
 */
async function fetchIncidentById(mail_id) {
  const incidentArray = await fetchApiData(
    `https://api.alpha-strike.space/incident?mail_id=${mail_id}`,
  );

  if (!incidentArray || incidentArray.length === 0) {
    return null;
  }

  const incident = incidentArray[0];

  // Enrich incident with character data
  const enrichedIncident = await enrichIncident(incident);

  // Return the enriched data in an array to match the frontend's expectation
  return [enrichedIncident];
}

/**
 * Fetches bare incident data from the search endpoint without enrichment.
 * @param {string} query - Search query
 * @param {string} type - 'name' or 'system'
 * @param {number} [limit] - The number of incidents to fetch.
 * @param {number} [offset] - The starting point for fetching incidents.
 * @returns {Promise<Incident[]>} - Array of bare incident objects.
 */
export async function searchBareIncidents(query, type, limit, offset) {
  let endpoint = "";
  if (type === "system") {
    endpoint = `https://api.alpha-strike.space/incident?system=${encodeURIComponent(query)}`;
  } else if (type === "name") {
    endpoint = `https://api.alpha-strike.space/incident?name=${encodeURIComponent(query)}`;
  } else if (type === "tribe") {
    endpoint = `https://api.alpha-strike.space/incident?tribe=${encodeURIComponent(query)}`;
  } else {
    return [];
  }

  if (limit !== undefined && offset !== undefined) {
    endpoint += `&limit=${limit}&offset=${offset}`;
  }

  try {
    const incidents = await fetchApiData(endpoint);
    if (!incidents || !Array.isArray(incidents)) {
      return [];
    }
    return incidents;
  } catch (error) {
    // Treat errors (e.g., 400 Bad Request for unknown tribe) as no results
    return [];
  }
}

/**
 * Search incidents by name or system
 * @param {string} query - Search query
 * @param {string} type - 'name' or 'system'
 * @param {number} [limit] - The number of incidents to fetch.
 * @param {number} [offset] - The starting point for fetching incidents.
 * @returns {Promise<Incident[]>} - Array of search results
 */
async function searchIncidents(query, type, limit, offset) {
  const incidents = await searchBareIncidents(query, type, limit, offset);

  if (!incidents || !Array.isArray(incidents)) {
    return [];
  }

  // Enrich incidents with character data
  const enrichedIncidents = await Promise.all(
    incidents.map(async (incident) => {
      return await enrichIncident(incident);
    }),
  );

  return enrichedIncidents;
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
  let endpoint = "";
  if (type === "system") {
    endpoint = `https://api.alpha-strike.space/totals?system=${encodeURIComponent(query)}`;
  } else if (type === "name") {
    endpoint = `https://api.alpha-strike.space/totals?name=${encodeURIComponent(query)}`;
  } else if (type === "tribe") {
    endpoint = `https://api.alpha-strike.space/totals?tribe=${encodeURIComponent(query)}`;
  } else {
    return [];
  }
  return await fetchApiData(endpoint);
}

async function fetchTribeByName(name, limit = 1, offset = 0) {
  const url = `https://api.alpha-strike.space/tribes?name=${encodeURIComponent(
    name,
  )}&limit=${limit}&offset=${offset}`;
  const data = await fetchApiData(url);
  // Some endpoints may return arrays; normalize to a single object if so
  if (Array.isArray(data)) {
    return data[0] || null;
  }
  return data;
}

// Export all functions
export {
  // Base utilities
  fetchApiData,
  // Health check
  checkServerHealth,
  // Character Endpoints
  fetchSmartCharacterByAddress,
  fetchSmartCharacterById,
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
  fetchTribeByName,
};
