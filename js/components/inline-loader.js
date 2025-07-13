/**
 * Creates and shows a non-blocking, inline loading indicator within a specified container.
 * @param {HTMLElement} container - The container element to append the loader to.
 * @param {string} [message='Loading...'] - An optional message to display.
 */
export function showInlineLoader(container, message = "Loading...") {
  if (!container) return;

  // Create a wrapper for the inline loader
  const loaderWrapper = document.createElement("div");
  loaderWrapper.className = "inline-loader-wrapper";

  // Square-based SVG icon, copied from the main loading overlay
  const svgIcon = `
<svg class="inline-loader-svg" xmlns="http://www.w3.org/2000/svg" width="38" height="43" viewBox="0 0 38 43" fill="none">
<rect x="20.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="20.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="25.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="30.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="35.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="0.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="5.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="10.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="30.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="35.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="40.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="15.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="20.5" width="2" height="2" fill="currentColor"></rect><rect x="0.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="5.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="10.5" y="25.5" width="2" height="2" fill="currentColor"></rect><rect x="15.5" y="25.5" width="2" height="2" fill="currentColor"></rect>
</svg>`.trim();

  const svgContainer = Array(10).fill(svgIcon).join("");

  // Construct the inner HTML
  loaderWrapper.innerHTML = `
    <div class="inline-loader">
        <div class="inline-loader-svg-container">
            ${svgContainer}
        </div>
      <span class="inline-loader-text">${message}</span>
    </div>
  `;

  // Clear previous content and append the new loader
  container.innerHTML = "";
  container.appendChild(loaderWrapper);
}

/**
 * Hides the inline loading indicator by clearing the container's content.
 * Note: This is a simple removal. If other content needs to be preserved, this function should be adjusted.
 * @param {HTMLElement} container - The container element where the loader was shown.
 */
export function hideInlineLoader(container) {
  if (container) {
    const loader = container.querySelector(".inline-loader-wrapper");
    if (loader) {
      loader.remove();
    }
  }
} 