import { currentLanguageIndex, languages, translations } from '../translation-dictionary.js';
import { lazyLoader } from '../utils/lazyLoading.js';
import { getLocalPortraitPath } from '../common.js';
import { fetchSmartCharacterByAddress } from '../api.js';

// Helper function to get translations
const getTranslation = (key, fallbackText = '') => {
  const lang = languages[currentLanguageIndex];
  return translations[key]?.[lang] || translations[key]?.en || fallbackText;
};

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
    totalEngagements > 0 ? (((item.total_kills || 0) / totalEngagements) * 100).toFixed(1) : 0;

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
  const header = document.createElement('div');
  header.className = 'card-header';

  const profileSection = document.createElement('div');
  profileSection.className = 'profile-section';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'profile-image-container';

  const image = document.createElement('img');
  image.className = 'profile-image';
  image.alt = `${item.name}'s profile`;

  const isIndexPage =
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("/Alpha-Strike-Main/");
  const assetBasePath = isIndexPage ? "./" : "../";

  image.src = getLocalPortraitPath(portraitUrl, assetBasePath);
  imageContainer.appendChild(image);

  const info = document.createElement('div');
  info.className = 'profile-info';

  const name = document.createElement('h2');
  name.className = 'player-name';
  name.textContent = item.name;

  const status = document.createElement('p');
  status.className = 'player-status';
  status.textContent = item.status || getTranslation('general.unknown');

  info.appendChild(name);
  info.appendChild(status);

  profileSection.appendChild(imageContainer);
  profileSection.appendChild(info);

  const headerStats = document.createElement('div');
  headerStats.className = 'header-stats';

  const kdStat = document.createElement('div');
  kdStat.className = 'header-stat';
  kdStat.innerHTML = `
        <div class="header-stat-value ${stats.killDeathRatio > 1 ? 'killer' : 'victim'}">${
          stats.killDeathRatio
        }</div>
        <div class="header-stat-label" data-translate="card.kdRatio">K/D Ratio</div>
    `;

  const winRateStat = document.createElement('div');
  winRateStat.className = 'header-stat';
  winRateStat.innerHTML = `
        <div class="header-stat-value">${stats.winRate}%</div>
        <div class="header-stat-label" data-translate="card.winRate">Win Rate</div>
    `;

  const engagementsStat = document.createElement('div');
  engagementsStat.className = 'header-stat';
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
  const statsGrid = document.createElement('div');
  statsGrid.className = 'stats-grid';

  const winRateItem = document.createElement('div');
  winRateItem.className = 'stat-item secondary';
  winRateItem.innerHTML = `
        <div class="stat-icon"><i class="fas fa-percentage"></i></div>
        <div class="stat-content">
            <span class="stat-value">${stats.winRate}%</span>
            <span class="stat-label" data-translate="card.winRate">Win Rate</span>
        </div>
    `;

  const engagementsItem = document.createElement('div');
  engagementsItem.className = 'stat-item secondary';
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
      : '< 1';
  const threatLevel =
    item.incident_count > 100 ? 'HIGH' : item.incident_count > 50 ? 'MEDIUM' : 'LOW';
  const threatClass =
    threatLevel === 'HIGH'
      ? 'threat-high'
      : threatLevel === 'MEDIUM'
        ? 'threat-medium'
        : 'threat-low';

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
  const header = document.createElement('div');
  header.className = 'card-header';

  const systemSection = document.createElement('div');
  systemSection.className = 'system-section';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'system-image-container';

  // Replace image with Font Awesome star icon
  const starIcon = document.createElement('i');
  starIcon.className = 'fa-solid fa-sun system-image';
  starIcon.setAttribute('aria-label', 'system star');
  imageContainer.appendChild(starIcon);

  const info = document.createElement('div');
  info.className = 'system-info';

  const name = document.createElement('h2');
  name.className = 'system-name';
  name.textContent = item.solar_system_name || item.name;

  const region = document.createElement('p');
  region.className = 'system-region';
  region.textContent = item.region_name || item.region || getTranslation('general.unknown');

  info.appendChild(name);
  info.appendChild(region);

  systemSection.appendChild(imageContainer);
  systemSection.appendChild(info);

  const headerStats = document.createElement('div');
  headerStats.className = 'header-stats';

  const incidentsStat = document.createElement('div');
  incidentsStat.className = 'header-stat';
  incidentsStat.innerHTML = `
        <div class="header-stat-value ${stats.threatClass}">${stats.totalIncidents}</div>
        <div class="header-stat-label" data-translate="card.incidentCount">Incidents</div>
    `;

  const avgPerDayStat = document.createElement('div');
  avgPerDayStat.className = 'header-stat';
  avgPerDayStat.innerHTML = `
        <div class="header-stat-value">${stats.avgIncidentsPerDay}</div>
        <div class="header-stat-label" data-translate="card.avgPerDay">Per Day</div>
    `;

  const activeDaysStat = document.createElement('div');
  activeDaysStat.className = 'header-stat';
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
 * Create the system card stats section
 */
function createSystemCardStats(item) {
  const statsGrid = document.createElement('div');
  statsGrid.className = 'stats-grid';

  return statsGrid;
}

/**
 * Create a player card with the given data
 */
async function createPlayerCard(item) {
  const card = document.createElement('div');
  card.className = 'data-card enhanced-player-card';
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
 * Create a system card with the given data
 */
function createSystemCard(item) {
  const card = document.createElement('div');
  card.className = 'data-card enhanced-system-card';
  card.dataset.id = item.id;

  const stats = calculateSystemStats(item);
  const header = createSystemCardHeader(item, stats);
  const statsSection = '';

  card.appendChild(header);
  // card.appendChild(statsSection);

  // Set up lazy loading for the system image
  const systemImage = card.querySelector('.system-image');
  if (systemImage) {
    const imageUrl = 'https://images.evetech.net/types/3796/render';
    lazyLoader.addLazyLoading(systemImage, imageUrl);
  }

  return card;
}

/**
 * Display the aggregate card based on search type
 */
async function displayAggregateCard(data, type) {
  const totalsCardContainer = document.getElementById('totals-card');
  totalsCardContainer.innerHTML = '';

  if (!data || data.length === 0) {
    totalsCardContainer.innerHTML = `<p data-translate="search.noAggregatedData">No aggregated data found.</p>`;
    return;
  }

  const item = data[0];
  const card =
    type === 'system'
      ? createSystemCard(item)
      : await createPlayerCard(item);
  totalsCardContainer.appendChild(card);
}

export { displayAggregateCard, createPlayerCard, createSystemCard };
