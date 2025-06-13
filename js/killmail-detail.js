import { fetchIncidentById } from "./api.js";
import { initializePage, getLocalPortraitPath } from "./common.js";
// Import translations and language utilities from translation-dictionary.js
import {
  currentLanguageIndex,
  languages,
  loadTranslations,
  setLanguage,
  translations,
} from "./translation-dictionary.js";
import { addIncidentCardListeners, navigateToSearch } from "./incidentCard.js";
import { lazyLoader } from "./utils/lazyLoading.js";
import { formatTimestamp, showLocalTime } from "./utils.js";
import { showLoading, hideLoading } from "./components/loadingOverlay.js";

let killmailDataStore = null; // Store fetched killmail data here

// Local helper to get translations, ensuring it uses the up-to-date currentLanguageIndex
const getTranslationLocal = (key, fallbackText = "", params = {}) => {
  const lang = languages[currentLanguageIndex]; // Uses the current language index from translation-dictionary
  let text =
    translations[key]?.[lang] ||
    translations[key]?.en || // Fallback to English
    fallbackText ||
    key;
  for (const p in params) {
    text = text.replace(new RegExp(`{${p}}`, "g"), params[p]);
  }
  return text;
};

// Local helper for general translations
const getGeneralTranslationLocal = (value, generalKeyIfEmpty) => {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return getTranslationLocal(
      `general.${generalKeyIfEmpty.toLowerCase()}`,
      generalKeyIfEmpty,
    );
  }
  return String(value);
};

function createCombatantCard(data, type) {
  const column = document.createElement("div");
  column.className = `combatant-column-km ${type}-column`;

  const card = document.createElement("div");
  card.className = `combatant-card-km ${type}-card-km`;

  const header = document.createElement("div");
  header.className = "combatant-header-km";

  const image = document.createElement("img");
  image.className = "profile-image";
  image.alt = getTranslationLocal(
    `altText.${type}Image`,
    `${type} ${data.name}`,
    {
      name: data.name,
    },
  );
  image.src = getLocalPortraitPath(data.portrait_url, "../");

  const info = document.createElement("div");
  info.className = "combatant-info-km";

  const roleLabel = document.createElement("h3");
  roleLabel.className = `combatant-role-label ${type}`;
  roleLabel.textContent = getTranslationLocal(
    `killmail.${type}Label`,
    type.toUpperCase(),
  );

  const name = document.createElement("h2");
  name.className = `${type} clickable-name`;
  name.dataset.name = data.name;
  name.title = getTranslationLocal(
    "tooltip.searchFor",
    "Search for {itemName}",
    {
      itemName: data.name,
    },
  );
  name.textContent = data.name;

  const corpInfo = document.createElement("p");
  corpInfo.innerHTML = `${getTranslationLocal(
    "killmail.corporationLabel",
    "Corporation:",
  )} <span class="placeholder">${getTranslationLocal(
    `killmail.placeholder.${type}Corp`,
    `[${type} Corp Placeholder]`,
  )}</span>`;

  const shipInfo = document.createElement("p");
  const shipPlaceholder =
    type === "victim" && (data.loss_type === "ship" || data.loss_type === "pod")
      ? data.loss_type
      : getTranslationLocal(
          `killmail.placeholder.${type}Ship`,
          `[${type} Ship Placeholder]`,
        );
  shipInfo.innerHTML = `${getTranslationLocal(
    "killmail.shipLabel",
    "Ship:",
  )} <span class="placeholder">${shipPlaceholder}</span>`;

  info.appendChild(roleLabel);
  info.appendChild(name);
  info.appendChild(corpInfo);
  info.appendChild(shipInfo);

  header.appendChild(image);
  header.appendChild(info);
  card.appendChild(header);
  column.appendChild(card);

  return column;
}

function createEngagementDetails(data) {
  const details = document.createElement("div");
  details.className = "engagement-details-km data-card";

  const title = document.createElement("h3");
  title.textContent = getTranslationLocal(
    "killmail.engagementDetailsTitle",
    "Engagement Details",
  );

  const lossType = document.createElement("p");
  lossType.innerHTML = `<strong>${getTranslationLocal(
    "killmail.lossTypeLabel",
    "Loss Type:",
  )}</strong> ${data.loss_type}`;

  const time = document.createElement("p");
  time.innerHTML = `<strong>${getTranslationLocal(
    "killmail.timeLabel",
    "Time:",
  )}</strong> ${formatTimestamp(data.time_stamp, showLocalTime)}`;

  const location = document.createElement("p");
  const locationSpan = document.createElement("span");
  locationSpan.className = "clickable-system";
  locationSpan.dataset.system = data.solar_system_name;
  locationSpan.title = getTranslationLocal(
    "tooltip.searchFor",
    "Search for {itemName}",
    {
      itemName: data.solar_system_name,
    },
  );
  locationSpan.textContent = data.solar_system_name;
  location.innerHTML = `<strong>${getTranslationLocal(
    "killmail.locationLabel",
    "Location:",
  )}</strong> `;
  location.appendChild(locationSpan);
  location.innerHTML += ` (${getTranslationLocal("card.idLabel", "ID:")} ${data.solar_system_id})`;

  details.appendChild(title);
  details.appendChild(lossType);
  details.appendChild(time);
  details.appendChild(location);

  return details;
}

function createFittingCategory(title, icon, items) {
  const details = document.createElement("details");
  details.className = "fitting-category";
  details.setAttribute("open", "");

  const summary = document.createElement("summary");
  summary.innerHTML = `<i class="fas fa-${icon}"></i> ${title}`;

  const list = document.createElement("ul");
  const listFragment = document.createDocumentFragment(); // Use a fragment for list items

  items.forEach((item) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.className = "placeholder";
    span.textContent = item;
    li.appendChild(span);
    listFragment.appendChild(li);
  });
  list.appendChild(listFragment); // Append all list items at once

  details.appendChild(summary);
  details.appendChild(list);

  return details;
}

function createFittingSection() {
  const section = document.createElement("div");
  section.className = "fitting-section-km data-card";

  const title = document.createElement("h3");
  title.textContent = getTranslationLocal(
    "killmail.fittingTitle",
    "Ship Fitting & Contents",
  );

  const note = document.createElement("p");
  note.className = "note";
  note.innerHTML = `<i class="fas fa-info-circle"></i> ${getTranslationLocal(
    "killmail.fittingNote",
    "Note: Fitting data is placeholder.",
  )}`;

  const table = document.createElement("div");
  table.className = "fitting-table-km";

  const categories = [
    {
      title: getTranslationLocal("killmail.fitting.highSlots", "High Slots"),
      icon: "crosshairs",
      items: [
        getTranslationLocal(
          "killmail.placeholder.highSlotItem1",
          "[High Slot Item 1]",
        ),
        getTranslationLocal(
          "killmail.placeholder.highSlotItem2",
          "[High Slot Item 2]",
        ),
        getTranslationLocal(
          "killmail.placeholder.emptyHighSlot",
          "[Empty High Slot]",
        ),
      ],
    },
    {
      title: getTranslationLocal("killmail.fitting.midSlots", "Mid Slots"),
      icon: "shield-alt",
      items: [
        getTranslationLocal(
          "killmail.placeholder.midSlotItem1",
          "[Mid Slot Item 1]",
        ),
        getTranslationLocal(
          "killmail.placeholder.midSlotItem2",
          "[Mid Slot Item 2]",
        ),
        getTranslationLocal(
          "killmail.placeholder.midSlotItem3",
          "[Mid Slot Item 3]",
        ),
      ],
    },
    {
      title: getTranslationLocal("killmail.fitting.lowSlots", "Low Slots"),
      icon: "cogs",
      items: [
        getTranslationLocal(
          "killmail.placeholder.lowSlotItem1",
          "[Low Slot Item 1]",
        ),
        getTranslationLocal(
          "killmail.placeholder.lowSlotItem2",
          "[Low Slot Item 2]",
        ),
        getTranslationLocal(
          "killmail.placeholder.lowSlotItem3",
          "[Low Slot Item 3]",
        ),
      ],
    },
    {
      title: getTranslationLocal("killmail.fitting.rigs", "Rigs"),
      icon: "microchip",
      items: [
        getTranslationLocal(
          "killmail.placeholder.rigSlotItem1",
          "[Rig Slot Item 1]",
        ),
        getTranslationLocal(
          "killmail.placeholder.rigSlotItem2",
          "[Rig Slot Item 2]",
        ),
        getTranslationLocal(
          "killmail.placeholder.rigSlotItem3",
          "[Rig Slot Item 3]",
        ),
      ],
    },
    {
      title: getTranslationLocal("killmail.fitting.drones", "Drones"),
      icon: "fighter-jet",
      items: [
        getTranslationLocal(
          "killmail.placeholder.droneItem1",
          "[Drone Item 1]",
        ),
        getTranslationLocal(
          "killmail.placeholder.droneItem2",
          "[Drone Item 2]",
        ),
      ],
    },
    {
      title: getTranslationLocal(
        "killmail.fitting.ammoCharges",
        "Ammunition / Charges",
      ),
      icon: "cubes",
      items: [
        getTranslationLocal("killmail.placeholder.ammoItem1", "[Ammo Item 1]"),
        getTranslationLocal("killmail.placeholder.ammoItem2", "[Ammo Item 2]"),
        getTranslationLocal("killmail.placeholder.ammoItem3", "[Ammo Item 3]"),
      ],
    },
    {
      title: getTranslationLocal("killmail.fitting.cargoHold", "Cargo Hold"),
      icon: "box-open",
      items: [
        getTranslationLocal(
          "killmail.placeholder.cargoItem1",
          "[Cargo Item 1]",
        ),
        getTranslationLocal(
          "killmail.placeholder.cargoItem2",
          "[Cargo Item 2]",
        ),
        getTranslationLocal(
          "killmail.placeholder.cargoItem3",
          "[Cargo Item 3]",
        ),
      ],
    },
  ];

  categories.forEach((category) => {
    table.appendChild(
      createFittingCategory(category.title, category.icon, category.items),
    );
  });

  section.appendChild(title);
  section.appendChild(note);
  section.appendChild(table);

  return section;
}

// This function now only focuses on rendering the HTML using provided data
function renderKillmailDetailsHTML(data) {
  const killmailContentEl = document.getElementById("killmail-content");
  const pageTitleContainerEl = document.getElementById(
    "killmail-page-title-container",
  );
  const documentTitleEl = document.querySelector("title");

  if (!killmailContentEl || !pageTitleContainerEl || !documentTitleEl) {
    console.error(
      "One or more essential DOM elements for killmail detail page are missing.",
    );
    if (killmailContentEl)
      killmailContentEl.innerHTML = `<p class="error">${getTranslationLocal(
        "error.generic",
        "An error occurred.",
      )}</p>`;
    return;
  }

  if (!data) {
    killmailContentEl.innerHTML = `<p class="error">${getTranslationLocal(
      "error.killmailLoadFailed",
      "Killmail data is not available to render.",
    )}</p>`;
    return;
  }

  const victimName = getGeneralTranslationLocal(data.victim_name, "unknown");
  const killerNameDisplay = getGeneralTranslationLocal(
    data.killer_name,
    "notApplicable",
  );
  const solarSystemName = getGeneralTranslationLocal(
    data.solar_system_name,
    "unknown",
  );
  const lossType = getGeneralTranslationLocal(data.loss_type, "classified");

  documentTitleEl.textContent = getTranslationLocal(
    "killmail.pageTitlePattern",
    "Killmail: {killerName} vs {victimName}",
    { killerName: killerNameDisplay, victimName: victimName },
  );

  // Use a document fragment to build the header content to minimize DOM manipulation
  const headerFragment = document.createDocumentFragment();
  const header = document.createElement("h1");
  const killerSpan = document.createElement("span");
  killerSpan.className = "killer clickable-name";
  killerSpan.dataset.name = killerNameDisplay;
  killerSpan.title = getTranslationLocal(
    "tooltip.searchFor",
    "Search for {itemName}",
    {
      itemName: killerNameDisplay,
    },
  );
  killerSpan.textContent = killerNameDisplay;

  const vsSpan = document.createElement("span");
  vsSpan.className = "text-primary";
  vsSpan.textContent = ` ${getTranslationLocal("killmail.headerVs", "vs")} `;

  const victimSpan = document.createElement("span");
  victimSpan.className = "victim clickable-name";
  victimSpan.dataset.name = victimName;
  victimSpan.title = getTranslationLocal(
    "tooltip.searchFor",
    "Search for {itemName}",
    {
      itemName: victimName,
    },
  );
  victimSpan.textContent = victimName;

  header.appendChild(killerSpan);
  header.appendChild(vsSpan);
  header.appendChild(victimSpan);

  const location = document.createElement("p");
  location.className = "system-location";
  const locationText = document.createTextNode(
    `${getTranslationLocal("killmail.headerIncidentIn", "Incident in")} `,
  );
  const systemSpan = document.createElement("span");
  systemSpan.className = "clickable-system";
  systemSpan.dataset.system = solarSystemName;
  systemSpan.title = getTranslationLocal(
    "tooltip.searchFor",
    "Search for {itemName}",
    {
      itemName: solarSystemName,
    },
  );
  systemSpan.textContent = solarSystemName;

  location.appendChild(locationText);
  location.appendChild(systemSpan);

  headerFragment.appendChild(header);
  headerFragment.appendChild(location);

  // Clear and append header
  pageTitleContainerEl.textContent = "";
  pageTitleContainerEl.appendChild(headerFragment);

  // Use a document fragment for the main content to minimize DOM manipulation
  const contentFragment = document.createDocumentFragment();

  // Create combatants grid
  const combatantsGrid = document.createElement("div");
  combatantsGrid.className = "combatants-grid-km";

  // Pass the specific portrait URLs down to the card creation function
  const killerData = {
    name: killerNameDisplay,
    loss_type: lossType,
    portrait_url: data.killer_portrait_url,
  };
  const victimData = {
    name: victimName,
    loss_type: lossType,
    portrait_url: data.victim_portrait_url,
  };

  combatantsGrid.appendChild(createCombatantCard(killerData, "killer"));
  combatantsGrid.appendChild(createCombatantCard(victimData, "victim"));
  contentFragment.appendChild(combatantsGrid);

  // Create engagement details
  const engagementDetails = createEngagementDetails(data);
  contentFragment.appendChild(engagementDetails);

  // Create fitting section
  const fittingSection = createFittingSection();
  contentFragment.appendChild(fittingSection);

  // Clear and append all sections at once
  killmailContentEl.textContent = "";
  killmailContentEl.appendChild(contentFragment);

  if (typeof addIncidentCardListeners === "function") {
    addIncidentCardListeners();
  }
}

export function onLanguageChange() {
  if (killmailDataStore) {
    renderKillmailDetailsHTML(killmailDataStore);
  } else {
    loadAndRenderKillmailPageContent();
  }
}

export async function loadAndRenderKillmailPageContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const mail_id = urlParams.get("mail_id");
  const killmailContentEl = document.getElementById("killmail-content");

  if (!killmailContentEl) {
    // Guard against missing element
    console.error("killmail-content element not found in DOM.");
    return;
  }

  if (mail_id) {
    try {
      // Fetch data only if it's not already in killmailDataStore
      if (
        !killmailDataStore ||
        killmailDataStore.id !== Number.parseInt(mail_id)
      ) {
        // also check if mail_id changed
        const incidentDataArray = await fetchIncidentById(mail_id);
        if (!incidentDataArray || incidentDataArray.length === 0) {
          hideLoading();
          throw new Error(
            getTranslationLocal(
              "error.killmailNotFound",
              "Killmail not found.",
            ),
          );
        }
        killmailDataStore = incidentDataArray[0]; // Store/update fetched data
      }

      renderKillmailDetailsHTML(killmailDataStore); // Render using the stored or newly fetched data
    } catch (error) {
      console.error("Failed to load killmail data from API:", error);
      killmailDataStore = null; // Clear data on error
      killmailContentEl.innerHTML = `<p class="error">${getTranslationLocal(
        "error.killmailLoadFailedApi",
        error.message || "Failed to load killmail data from API.",
      )}</p>`;
    }
  } else {
    killmailDataStore = null; // Clear data if no mail_id
    killmailContentEl.innerHTML = `<p class="error">${getTranslationLocal(
      "error.noKillmailId",
      "No killmail ID provided in URL.",
    )}</p>`;
  }
  // Ensure translations for any data-translate attributes are applied after rendering
  // This is particularly for elements outside renderKillmailDetailsHTML or if it adds data-translate itself.
  const currentLang = localStorage.getItem("preferredLanguage") || languages[0];
  if (typeof setLanguage === "function") {
    setLanguage(currentLang);
  }
  hideLoading();
}
