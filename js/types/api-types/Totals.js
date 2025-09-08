/**
 * @typedef {object} TopKiller
 * @property {string} name - The name of the top killer.
 * @property {number} kills - The number of kills attributed to this killer.
 */

/**
 * @typedef {object} TopVictim
 * @property {string} name - The name of the top victim.
 * @property {number} losses - The number of times this victim was killed.
 */

/**
 * @typedef {object} TopSystem
 * @property {string} system_id - The ID of the system.
 * @property {string} system_name - The name of the system.
 * @property {number} kills - The number of kills in this system.
 */

/**
 * @typedef {object} TopTribe
 * @property {string} name - The name of the tribe.
 * @property {number} total_kills - The number of kills attributed to this tribe.
 * @property {number} total_losses - The number of losses attributed to this tribe.
 */

/**
 * @typedef {object} TotalsResponse
 * @property {TopKiller[]} top_killers - Array of top killers.
 * @property {TopVictim[]} top_victims - Array of top victims.
 * @property {TopSystem[]} top_systems - Array of top systems.
 * @property {TopTribe[]} top_tribes - Array of top tribes.
 */
