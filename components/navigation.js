/**
 * Navigation component manager
 */
function createNavigation(activePage) {
  return `
    <div class="topnav">
    <a ${activePage === "home" ? 'class="active"' : ""} href="../index.html" data-translate="navbar.home"><i class="fa-sharp fa-solid fa-trophy"></i>Recently Stamped</a>
    <a ${activePage === "killers" ? 'class="active"' : ""} href="../pages/killers.html" data-translate="navbar.killers">Leading Killers</a>
    <a ${activePage === "systems" ? 'class="active"' : ""} href="../pages/systems.html" data-translate="navbar.systems">Leading Systems</a>
    <a ${activePage === "victims" ? 'class="active"' : ""} href="../pages/victims.html" data-translate="navbar.victims">Leading Victims</a>
    <a ${activePage === "search" ? 'class="active"' : ""} href="../pages/search.html" data-translate="navbar.search">Search</a>
    <button id="animatedLangBtn">EN</button>
    </div>
    `;
}

/**
 * Initialize navigation on page load
 * @param {string} activePage - The currently active page identifier
 */
function initializeNavigation(activePage) {
  const navContainer = document.getElementById("navigation-container");
  if (navContainer) {
    // Determine base path for links based on current page depth
    const isIndexPage =
      window.location.pathname.endsWith("index.html") ||
      window.location.pathname === "/"; // Adjust if your root path is different
    const basePath = isIndexPage ? "" : "../"; // If in a subdirectory like /pages/, go up one level for root links

    navContainer.innerHTML = `
            <div class="topnav">
            <a ${activePage === "home" ? 'class="active"' : ""} href="${basePath}index.html"><i class="fa-sharp fa-solid fa-trophy"></i> <span data-translate="navbar.home">Recently Stamped</span></a>
            <a ${activePage === "killers" ? 'class="active"' : ""} href="${basePath}pages/killers.html"><i class="fa-solid fa-skull-crossbones"></i> <span data-translate="navbar.killers">Leading Killers</span></a>
            <a ${activePage === "victims" ? 'class="active"' : ""} href="${basePath}pages/victims.html"><i class="fa-solid fa-user-shield"></i> <span data-translate="navbar.victims">Leading Victims</span></a>
            <a ${activePage === "systems" ? 'class="active"' : ""} href="${basePath}pages/systems.html"><i class="fa-solid fa-map-location-dot"></i> <span data-translate="navbar.systems">Leading Systems</span></a>
            <a ${activePage === "search" ? 'class="active"' : ""} href="${basePath}pages/search.html"><i class="fa-solid fa-magnifying-glass"></i> <span data-translate="navbar.search">Search</span></a>
            <button id="animatedLangBtn">EN</button>
            </div>
        `;
  } else {
    console.error("Navigation container #navigation-container not found.");
  }
  // REMOVED: });
}
