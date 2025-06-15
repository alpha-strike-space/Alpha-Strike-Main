/**
 * Renders pagination controls.
 * @param {object} options - The pagination options.
 * @param {HTMLElement} options.container - The container element for the pagination controls.
 * @param {number} options.currentPage - The current active page.
 * @param {boolean} options.hasNextPage - A boolean to indicate if there is a next page.
 * @param {function(number): void} options.onPageClick - The callback function to execute when a page button is clicked.
 */
export function renderPaginationControls({ container, currentPage, hasNextPage, onPageClick }) {
  if (!container) return;

  container.innerHTML = "";

  const createButton = (text, page, disabled = false, isActive = false) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.disabled = disabled;
    if (isActive) {
      button.classList.add("active");
    }
    button.addEventListener("click", () => onPageClick(page));
    return button;
  };

  // Previous Button
  container.appendChild(createButton("«", currentPage - 1, currentPage === 1));

  // Page numbers
  const pagesToShow = 2; // Pages before and after current
  let startPage = Math.max(1, currentPage - pagesToShow);
  let endPage = currentPage + pagesToShow;

  // "First" button and ellipsis
  if (startPage > 1) {
    container.appendChild(createButton("1", 1));
    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      container.appendChild(ellipsis);
    }
  }

  // Numbered page buttons
  for (let i = startPage; i <= endPage; i++) {
    if (i > currentPage && !hasNextPage) continue;
    container.appendChild(createButton(i.toString(), i, false, i === currentPage));
  }

  // Ellipsis and "Next" button
  if (hasNextPage) {
    const ellipsis = document.createElement("span");
    ellipsis.textContent = "...";
    container.appendChild(ellipsis);
  }

  // Next Button
  container.appendChild(createButton("»", currentPage + 1, !hasNextPage));
} 