/**
 * @typedef {object} Coordinates
 * @property {string} x - The x-coordinate in the solar system.
 * @property {string} y - The y-coordinate in the solar system.
 * @property {string} z - The z-coordinate in the solar system.
 */

/**
 * @typedef {Object} Location
 * @property {number} solar_system_id - The ID of the solar system.
 * @property {string} solar_system_name - The name of the solar system.
 * @property {Coordinates} coordinates - The coordinates of the solar system.
 */

/**
 * @typedef {Location[]} LocationResponse - Array of location objects returned by the API
 */
