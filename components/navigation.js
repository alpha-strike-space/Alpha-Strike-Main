// components/navigation.js

/**
 * Navigation component manager
 */

// createNavigation function is not directly used by initializePage,
// but if you use it elsewhere, it should also be updated similarly.
// For now, focusing on initializeNavigation as it's the one setting innerHTML.

/**
 * Initialize navigation on page load
 * @param {string} activePage - The currently active page identifier
 */
export function initializeNavigation(activePage) {
  const navContainer = document.getElementById("navigation-container");
  if (navContainer) {
    const isIndexPage =
      window.location.pathname.endsWith("index.html") ||
      window.location.pathname === "/" ||
      window.location.pathname.endsWith("/Alpha-Strike-Main/"); // Adjusted for potential base path
    const basePath = isIndexPage ? "" : "../";

    navContainer.innerHTML = `
      <div class="topnav" id="myTopnav">
        <a href="${basePath}index.html" class="nav-logo alpha-strike-logo">
            Alpha-Strike
        </a>
        <button class="hamburger-menu" id="hamburgerBtn" aria-label="Toggle menu" aria-expanded="false" aria-controls="topnavLinks">
            <i class="fas fa-bars" aria-hidden="true"></i>
        </button>
        <div class="topnav-links" id="topnavLinks">
            <a ${activePage === "home" ? 'class="active"' : ""} href="${basePath}index.html"><i class="fa-sharp fa-solid fa-trophy"></i> <span data-translate="navbar.home">Recently Stamped</span></a>
            <a ${activePage === "killers" ? 'class="active"' : ""} href="${basePath}pages/killers.html"><i class="fa-solid fa-skull-crossbones"></i> <span data-translate="navbar.killers">Leading Killers</span></a>
            <a ${activePage === "victims" ? 'class="active"' : ""} href="${basePath}pages/victims.html"><i class="fa-solid fa-user-shield"></i> <span data-translate="navbar.victims">Leading Victims</span></a>
            <a ${activePage === "systems" ? 'class="active"' : ""} href="${basePath}pages/systems.html"><i class="fa-solid fa-map-location-dot"></i> <span data-translate="navbar.systems">Leading Systems</span></a>
            <a ${activePage === "tribes" ? 'class="active"' : ""} href="${basePath}pages/tribes.html"><i class="fa-solid fa-users"></i> <span data-translate="navbar.tribes">Leading Tribes</span></a>
            <div class="nav-search-container">
                <button id="navSearchToggle" class="nav-search-toggle" aria-label="Toggle search">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </button>
                <div id="navSearchDropdown" class="nav-search-dropdown">
                    <div class="nav-search">
                        <select id="navSearchType">
                            <option value="name" data-translate="search.byName">Character</option>
                            <option value="system" data-translate="search.bySystem">System</option>
                            <option value="tribe" data-translate="search.byTribe">Tribe</option>
                        </select>
                        <input type="text" id="navSearchQuery" placeholder="Search..." data-translate="search.placeholder" />
                        <button id="navSearchBtn" aria-label="Search">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                    </div>
                </div>
            </div>
            <button id="animatedLangBtn" class="lang-btn-nav">EN</button>
        </div>
      </div>
    `;

    // JavaScript for hamburger menu functionality
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const topnavLinks = document.getElementById("topnavLinks");
    const topnav = document.getElementById("myTopnav");
    const icon = hamburgerBtn.querySelector("i");

    if (hamburgerBtn && topnavLinks && topnav && icon) {
      hamburgerBtn.addEventListener("click", () => {
        topnavLinks.classList.toggle("open");
        topnav.classList.toggle("open"); // For potential styling of the main bar when menu is open
        const isOpen = topnavLinks.classList.contains("open");
        hamburgerBtn.setAttribute("aria-expanded", isOpen.toString());
        if (isOpen) {
          icon.classList.remove("fa-bars");
          icon.classList.add("fa-times");
        } else {
          icon.classList.remove("fa-times");
          icon.classList.add("fa-bars");
        }
      });
    } else {
      console.error(
        "Hamburger menu elements not found. Navigation interactivity may be affected.",
      );
    }

    // Add click outside handler for search dropdown
    document.addEventListener("click", (event) => {
      const searchContainer = document.querySelector(".nav-search-container");
      const searchToggle = document.getElementById("navSearchToggle");
      const searchDropdown = document.getElementById("navSearchDropdown");

      if (searchContainer && searchToggle && searchDropdown) {
        if (!searchContainer.contains(event.target)) {
          searchDropdown.classList.remove("show");
        }
      }
    });

    // Add click handler for search toggle
    const searchToggle = document.getElementById("navSearchToggle");
    const searchDropdown = document.getElementById("navSearchDropdown");

    if (searchToggle && searchDropdown) {
      searchToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        searchDropdown.classList.toggle("show");
        if (searchDropdown.classList.contains("show")) {
          document.getElementById("navSearchQuery")?.focus();
        }
      });
    }
  } else {
    console.error("Navigation container #navigation-container not found.");
  }
}
