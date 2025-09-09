import {
  currentLanguageIndex,
  languages,
  translations,
} from "../translation-dictionary.js";
import { lazyLoader } from "../utils/lazyLoading.js";
import { getLocalPortraitPath } from "../common.js";
import { fetchSmartCharacterByAddress, fetchTribeByName } from "../api.js";
import { showLoading, hideLoading } from "./loadingOverlay.js";
import { addIncidentCardListeners } from "../incidentCard.js";

// Helper function to get translations
const getTranslation = (key, fallbackText = "") => {
  const lang = languages[currentLanguageIndex];
  return translations[key]?.[lang] || translations[key]?.en || fallbackText;
};

// Map a 0-1 position to a color sampled from the specified gradient
// linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(255,246,69,1) 66%, rgba(61,255,142,1) 89%, rgba(0,208,255,1) 99%)
function getGradientColorAt(position) {
  const pos = Math.min(1, Math.max(0, Number(position) || 0));
  const stops = [
    { p: 0.0, r: 210, g: 36, b: 36 },
    { p: 0.67, r: 207, g: 199, b: 54 },
    { p: 0.9, r: 45, g: 200, b: 110 },
    { p: 1.0, r: 45, g: 165, b: 195 },
  ];

  if (pos <= stops[0].p) {
    const { r, g, b } = stops[0];
    return `rgb(${r}, ${g}, ${b})`;
  }

  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const next = stops[i];
    if (pos <= next.p) {
      const t = (pos - prev.p) / (next.p - prev.p);
      const r = Math.round(prev.r + t * (next.r - prev.r));
      const g = Math.round(prev.g + t * (next.g - prev.g));
      const b = Math.round(prev.b + t * (next.b - prev.b));
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  const { r, g, b } = stops[stops.length - 1];
  return `rgb(${r}, ${g}, ${b})`;
}

// Map a 0-1 win rate to an aggressive descriptor without adding color stops
function getWinRateDescriptor(position) {
  const p = Math.min(1, Math.max(0, Number(position) || 0));
  if (p <= 0.1) return "stoic";
  if (p <= 0.25) return "probing";
  if (p <= 0.33) return "prowling";
  if (p <= 0.42) return "stalking";
  if (p <= 0.5) return "menacing";
  if (p <= 0.67) return "predatory";
  if (p <= 0.9) return "ruthless";
  return "lethal";
}

/**
 * Calculate player statistics for the card
 */
function calculatePlayerStats(item) {
  const killDeathRatio =
    item.total_losses > 0
      ? (item.total_kills / item.total_losses).toFixed(2)
      : item.total_kills || 0;
  const totalEngagements = (item.total_kills || 0) + (item.total_losses || 0);
  const winRate =
    totalEngagements > 0
      ? (((item.total_kills || 0) / totalEngagements) * 100).toFixed(1)
      : 0;

  return {
    killDeathRatio,
    totalEngagements,
    winRate,
  };
}

/**
 * Create the player card header section
 */
function createPlayerCardHeader(item, stats, portraitUrl) {
  const header = document.createElement("div");
  header.className = "card-header";

  const profileSection = document.createElement("div");
  profileSection.className = "profile-section";

  const imageContainer = document.createElement("div");
  imageContainer.className = "profile-image-container";

  const image = document.createElement("img");
  image.className = "profile-image";
  image.alt = `${item.name}'s profile`;

  const isIndexPage =
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("/Alpha-Strike-Main/");
  const assetBasePath = isIndexPage ? "./" : "../";

  image.src = getLocalPortraitPath(portraitUrl, assetBasePath);
  imageContainer.appendChild(image);

  const info = document.createElement("div");
  info.className = "profile-info";

  const name = document.createElement("h1");
  name.className = "player-name";
  name.textContent = item.name;

  const status = document.createElement("p");
  status.className = "player-status clickable-tribe";
  status.dataset.tribe = item.tribe_name;
  status.title =
    getTranslation("tooltip.searchFor", "Search for: ", {
      itemName: item.tribe_name,
    }) + item.tribe_name;
  status.textContent = item.tribe_name || getTranslation("general.unknown");
  // Append inline external-link icon
  const tribeIcon = document.createElement("i");
  tribeIcon.className = "fa-sharp fa-solid fa-arrow-up-right-from-square";
  tribeIcon.setAttribute("aria-hidden", "true");
  tribeIcon.style = "margin-left: 0.1rem; vertical-align: super; font-size: 0.5rem;";
  status.appendChild(tribeIcon);

  info.appendChild(name);
  info.appendChild(status);

  profileSection.appendChild(imageContainer);
  profileSection.appendChild(info);

  const headerStats = document.createElement("div");
  headerStats.className = "header-stats";

  const kdStat = document.createElement("div");
  kdStat.className = "header-stat";
  kdStat.innerHTML = `
        <div class="header-stat-value ${stats.killDeathRatio > 1 ? "killer" : "victim"}">${
          stats.killDeathRatio
        }</div>
        <div class="header-stat-label" data-translate="card.kdRatio">K/D Ratio</div>
    `;

  const winRateStat = document.createElement("div");
  winRateStat.className = "header-stat";
  winRateStat.innerHTML = `
        <div class="header-stat-value">${stats.winRate}%</div>
        <div class="header-stat-label" data-translate="card.winRate">Win Rate</div>
    `;

  // Color the win-rate text by gradient position
  const winRateDecimal = Math.min(
    1,
    Math.max(0, (parseFloat(stats.winRate) || 0) / 100),
  );
  const winRateColor = getGradientColorAt(winRateDecimal);
  const winRateValueEl = winRateStat.querySelector(".header-stat-value");
  if (winRateValueEl) {
    winRateValueEl.style.color = winRateColor;
  }

  // Insert descriptor text for the win-rate in header
  const headerDescriptor = document.createElement("div");
  headerDescriptor.className = "header-stat-descriptor";
  headerDescriptor.textContent =
    getWinRateDescriptor(winRateDecimal).toUpperCase();
  const winRateLabelEl = winRateStat.querySelector(".header-stat-label");
  if (winRateLabelEl) {
    winRateStat.insertBefore(headerDescriptor, winRateLabelEl);
  } else {
    winRateStat.appendChild(headerDescriptor);
  }

  const engagementsStat = document.createElement("div");
  engagementsStat.className = "header-stat";
  engagementsStat.innerHTML = `
        <div class="header-stat-value">${stats.totalEngagements}</div>
        <div class="header-stat-label" data-translate="card.totalEngagements">Total Engagements</div>
    `;

  headerStats.appendChild(kdStat);
  headerStats.appendChild(winRateStat);
  headerStats.appendChild(engagementsStat);

  header.appendChild(profileSection);
  header.appendChild(headerStats);

  return header;
}

/**
 * Create the player card stats section
 */
function createPlayerCardStats(stats) {
  const statsGrid = document.createElement("div");
  statsGrid.className = "stats-grid";

  const winRateItem = document.createElement("div");
  winRateItem.className = "stat-item secondary";
  winRateItem.innerHTML = `
        <div class="stat-icon"><i class="fas fa-percentage"></i></div>
        <div class="stat-content">
            <span class="stat-value">${stats.winRate}%</span>
            <span class="stat-label" data-translate="card.winRate">Win Rate</span>
        </div>
    `;

  // Apply gradient-based color to the stat-content background and value text
  const winRateDecimal = Math.min(
    1,
    Math.max(0, (parseFloat(stats.winRate) || 0) / 100),
  );
  const winRateColor = getGradientColorAt(winRateDecimal);
  const statContentEl = winRateItem.querySelector(".stat-content");
  const statValueEl = winRateItem.querySelector(".stat-value");
  if (statContentEl) {
    statContentEl.style.backgroundColor = winRateColor;
    statContentEl.style.borderRadius = "4px";
    statContentEl.style.padding = "4px 8px";
  }
  if (statValueEl) {
    statValueEl.style.color = "#000";
    statValueEl.style.textShadow = "none";
  }

  // Add descriptor below the value in the stats grid
  if (statContentEl) {
    const descriptorEl = document.createElement("span");
    descriptorEl.className = "stat-descriptor";
    descriptorEl.textContent =
      getWinRateDescriptor(winRateDecimal).toUpperCase();
    descriptorEl.style.fontSize = "0.75rem";
    descriptorEl.style.opacity = "0.9";
    descriptorEl.style.color = "#000";
    statContentEl.insertBefore(
      descriptorEl,
      statContentEl.querySelector(".stat-label"),
    );
  }

  const engagementsItem = document.createElement("div");
  engagementsItem.className = "stat-item secondary";
  engagementsItem.innerHTML = `
        <div class="stat-icon"><i class="fas fa-fire"></i></div>
        <div class="stat-content">
            <span class="stat-value">${stats.totalEngagements}</span>
            <span class="stat-label" data-translate="card.totalEngagements">Total Engagements</span>
        </div>
    `;

  statsGrid.appendChild(winRateItem);
  statsGrid.appendChild(engagementsItem);

  return statsGrid;
}

/**
 * Calculate system statistics for the card
 */
function calculateSystemStats(item) {
  const avgIncidentsPerDay =
    item.incident_count && item.days_active
      ? (item.incident_count / item.days_active).toFixed(1)
      : "< 1";
  const threatLevel =
    item.incident_count > 100
      ? "HIGH"
      : item.incident_count > 50
        ? "MEDIUM"
        : "LOW";
  const threatClass =
    threatLevel === "HIGH"
      ? "threat-high"
      : threatLevel === "MEDIUM"
        ? "threat-medium"
        : "threat-low";

  return {
    avgIncidentsPerDay,
    threatLevel,
    threatClass,
    totalIncidents: item.incident_count || 0,
    activeDays: item.days_active || 0,
  };
}

/**
 * Create the system card header section
 */
function createSystemCardHeader(item, stats) {
  const header = document.createElement("div");
  header.className = "card-header";

  const systemSection = document.createElement("div");
  systemSection.className = "system-section";

  const imageContainer = document.createElement("div");
  imageContainer.className = "system-image-container";

  // Replace image with Font Awesome star icon
  const starIcon = document.createElement("i");
  starIcon.className = "fa-solid fa-sun system-image";
  starIcon.setAttribute("aria-label", "system star");
  imageContainer.appendChild(starIcon);

  const info = document.createElement("div");
  info.className = "system-info";

  const name = document.createElement("h2");
  name.className = "system-name";
  name.textContent = item.solar_system_name || item.name;

  const region = document.createElement("p");
  region.className = "system-region";
  region.textContent =
    item.region_name || item.region || getTranslation("general.unknown");

  info.appendChild(name);
  info.appendChild(region);

  systemSection.appendChild(imageContainer);
  systemSection.appendChild(info);

  const headerStats = document.createElement("div");
  headerStats.className = "header-stats";

  const incidentsStat = document.createElement("div");
  incidentsStat.className = "header-stat";
  incidentsStat.innerHTML = `
        <div class="header-stat-value ${stats.threatClass}">${stats.totalIncidents}</div>
        <div class="header-stat-label" data-translate="card.incidentCount">Incidents</div>
    `;

  const avgPerDayStat = document.createElement("div");
  avgPerDayStat.className = "header-stat";
  avgPerDayStat.innerHTML = `
        <div class="header-stat-value">${stats.avgIncidentsPerDay}</div>
        <div class="header-stat-label" data-translate="card.avgPerDay">Per Day</div>
    `;

  const activeDaysStat = document.createElement("div");
  activeDaysStat.className = "header-stat";
  activeDaysStat.innerHTML = `
        <div class="header-stat-value">${stats.activeDays}</div>
        <div class="header-stat-label" data-translate="card.activeDays">Active Days</div>
    `;

  headerStats.appendChild(incidentsStat);
  headerStats.appendChild(avgPerDayStat);
  headerStats.appendChild(activeDaysStat);

  header.appendChild(systemSection);
  header.appendChild(headerStats);

  return header;
}

/**
 * Create the tribe card header section. Similar to system card header section, but with player stats.
 */

async function createTribeCardHeader(item, stats) {
  const header = document.createElement("div");
  header.className = "card-header";

  const profileSection = document.createElement("div");
  profileSection.className = "profile-section";

  const imageContainer = document.createElement("div");
  imageContainer.className = "profile-image-container";

  // Font Awesome logo icon
  const logo = document.createElement("i");
  logo.className = "fa-solid fa-users-line system-image";
  logo.setAttribute("aria-label", "tribe logo");
  imageContainer.appendChild(logo);

  const info = document.createElement("div");
  info.className = "profile-info";

  const name = document.createElement("h1");
  name.className = "player-name clickable-tribe";
  name.textContent = item.tribe_name;
  // Make tribe name clickable for search navigation
  name.dataset.tribe = item.tribe_name;
  name.title =
    getTranslation("tooltip.searchFor", "Search for: ") + item.tribe_name;

  info.appendChild(name);

  // Tribes can create their own website, so we need to add a link to it. If they don't have one, the API value will be "NONE".
  if (item.tribe_url && item.tribe_url !== "NONE") {
    const tribeURL = document.createElement("div");
    tribeURL.className = "tribe-url";
    const link = document.createElement("a");
    link.href = item.tribe_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Tribe URL";
    link.addEventListener("click", async (e) => {
      try {
        e.preventDefault();
        const module = await import("./modal.js");
        if (module && typeof module.showExternalLinkModal === "function") {
          module.showExternalLinkModal(item.tribe_url);
        } else {
          window.open(item.tribe_url, "_blank", "noopener,noreferrer");
        }
      } catch (_) {
        window.open(item.tribe_url, "_blank", "noopener,noreferrer");
      }
    });
    tribeURL.appendChild(link);
    info.appendChild(tribeURL);
  }

  profileSection.appendChild(imageContainer);
  profileSection.appendChild(info);

  const headerStats = document.createElement("div");
  headerStats.className = "header-stats";

  const kdStat = document.createElement("div");
  kdStat.className = "header-stat";
  kdStat.innerHTML = `
        <div class="header-stat-value ${stats.killDeathRatio > 1 ? "killer" : "victim"}">${
          stats.killDeathRatio
        }</div>
        <div class="header-stat-label" data-translate="card.kdRatio">K/D Ratio</div>
    `;

  const winRateStat = document.createElement("div");
  winRateStat.className = "header-stat";
  winRateStat.innerHTML = `
        <div class="header-stat-value">${stats.winRate}%</div>
        <div class="header-stat-label" data-translate="card.winRate">Win Rate</div>
    `;

  // Color the win-rate text by gradient position
  const winRateDecimal = Math.min(
    1,
    Math.max(0, (parseFloat(stats.winRate) || 0) / 100),
  );
  const winRateColor = getGradientColorAt(winRateDecimal);
  const winRateValueEl = winRateStat.querySelector(".header-stat-value");
  if (winRateValueEl) {
    winRateValueEl.style.color = winRateColor;
  }

  // Insert descriptor text for the win-rate in header
  const headerDescriptor = document.createElement("div");
  headerDescriptor.className = "header-stat-descriptor";
  headerDescriptor.textContent =
    getWinRateDescriptor(winRateDecimal).toUpperCase();
  const winRateLabelEl = winRateStat.querySelector(".header-stat-label");
  if (winRateLabelEl) {
    winRateStat.insertBefore(headerDescriptor, winRateLabelEl);
  } else {
    winRateStat.appendChild(headerDescriptor);
  }

  const engagementsStat = document.createElement("div");
  engagementsStat.className = "header-stat";
  engagementsStat.innerHTML = `
        <div class="header-stat-value">${stats.totalEngagements}</div>
        <div class="header-stat-label" data-translate="card.totalEngagements">Total Engagements</div>
    `;

  const numCharactersStat = document.createElement("div");
  numCharactersStat.className = "header-stat";
  numCharactersStat.innerHTML = `
        <div class="header-stat-value">${item.member_count}</div>
        <div class="header-stat-label">
          <span data-translate="card.numCharacters">Member Count</span>
          <i class="fa-sharp fa-solid fa-arrow-up-right-from-square" aria-hidden="true" style="margin-left: 0.2rem; font-size: 0.5rem; vertical-align: super;"></i>
        </div>
    `;

  const tribeCharacterModal = await import("./tribeCharacterModal.js");
  numCharactersStat.addEventListener("click", () => {
    tribeCharacterModal.showTribeCharacterModal(item.tribe_name);
  });
  // Communicate clickability: pointer cursor, tooltip, and keyboard support
  numCharactersStat.classList.add("clickable");
  numCharactersStat.title = getTranslation("card.numCharacters", "Member Count");
  numCharactersStat.setAttribute("role", "button");
  numCharactersStat.tabIndex = 0;
  numCharactersStat.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      numCharactersStat.click();
    }
  });
  

  headerStats.appendChild(kdStat);
  headerStats.appendChild(winRateStat);
  headerStats.appendChild(engagementsStat);
  headerStats.appendChild(numCharactersStat);



  header.appendChild(profileSection);
  header.appendChild(headerStats);

  return header;
}

/**
 * Create the system card stats section
 */
function createSystemCardStats(item) {
  const statsGrid = document.createElement("div");
  statsGrid.className = "stats-grid";

  return statsGrid;
}

/**
 * Create a player card with the given data
 */
async function createPlayerCard(item) {
  const card = document.createElement("div");
  card.className = "data-card enhanced-player-card";
  card.dataset.id = item.id;

  // Prioritize the portraitUrl passed in the item (e.g., from aggregate card)
  let portraitUrl = item.portraitUrl || null;

  // If we don't have a portraitUrl, try to fetch it via character address.
  // This handles other contexts where the card might be used.
  if (!portraitUrl && item.character_address) {
    try {
      const character = await fetchSmartCharacterByAddress(
        item.character_address,
      );
      if (character) {
        portraitUrl = character.portraitUrl;
      }
    } catch (error) {
      console.warn(
        `Could not fetch character by address for card: ${item.character_address}`,
        error,
      );
    }
  }

  const stats = calculatePlayerStats(item);
  const header = createPlayerCardHeader(item, stats, portraitUrl);
  // const statsSection = createPlayerCardStats(stats);

  card.appendChild(header);
  // card.appendChild(statsSection);

  return card;
}

/**
 * Create a tribe card with the given data. Similar to system card, but with player stats.
 */

async function createTribeCard(item) {
  const card = document.createElement("div");
  card.className = "data-card enhanced-player-card";
  card.dataset.id = item.id;

  // Only fetch tribe metadata if needed, and use paginated (limit=1) request

    try {
      const tribe_data = await fetchTribeByName(item.tribe_name, 1, 0);
      if (tribe_data && tribe_data.tribe_url) {
        item.tribe_url = tribe_data.tribe_url;
        item.member_count = tribe_data.member_count;
      }
    } catch (error) {
      console.warn(
        "Failed to fetch tribe data for card:",
        item.tribe_name,
        error,
      );
    }
  

  const stats = calculatePlayerStats(item);
  const header = await createTribeCardHeader(item, stats);

  card.appendChild(header);

  return card;
}

/**
 * Create a system card with the given data
 */
function createSystemCard(item) {
  const card = document.createElement("div");
  card.className = "data-card enhanced-system-card";
  card.dataset.id = item.id;

  const stats = calculateSystemStats(item);
  const header = createSystemCardHeader(item, stats);
  const statsSection = "";

  card.appendChild(header);
  // card.appendChild(statsSection);

  // Set up lazy loading for the system image
  const systemImage = card.querySelector(".system-image");
  if (systemImage) {
    const imageUrl = "https://images.evetech.net/types/3796/render";
    lazyLoader.addLazyLoading(systemImage, imageUrl);
  }

  return card;
}

/**
 * Display the aggregate card based on search type
 */
async function displayAggregateCard(data, type) {
  const totalsCardContainer = document.getElementById("totals-card");
  totalsCardContainer.innerHTML = "";
  showLoading();
  try {
    if (!data || data.length === 0) {
      totalsCardContainer.innerHTML = `<p data-translate="search.noAggregatedData">No aggregated data found.</p>`;
      return;
    }

    const item = data[0];
    let card = null;
    if (type === "system") {
      card = createSystemCard(item);
    } else if (type === "name") {
      card = await createPlayerCard(item);
    } else if (type === "tribe") {
      card = await createTribeCard(item);
    }

    totalsCardContainer.appendChild(card);
    // Attach click listeners for any clickable elements within the aggregate card
    addIncidentCardListeners(card);
  } catch (error) {
    console.error("Failed to render aggregate card:", error);
    totalsCardContainer.innerHTML = `<p data-translate="search.error">Error loading aggregated data.</p>`;
  } finally {
    hideLoading();
  }
}

export { displayAggregateCard, createPlayerCard, createSystemCard };
