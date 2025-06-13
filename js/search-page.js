import { showLoading, hideLoading } from "/js/components/loadingOverlay.js";
import { initializePage } from "/js/common.js";
import { initializeSearchPage } from "/js/search.js";

showLoading();
document.addEventListener("DOMContentLoaded", () => {
  initializePage("search");
  initializeSearchPage();
  hideLoading();
}); 