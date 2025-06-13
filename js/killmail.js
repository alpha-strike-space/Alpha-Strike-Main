import { loadAndRenderKillmailPageContent, onLanguageChange } from "./killmail-detail.js";
import {
  showLoading,
  hideLoading,
} from "./components/loadingOverlay.js";
import { initializePage } from "./common.js";
import { loadTranslations } from "./translation-dictionary.js";

showLoading();
document.addEventListener("DOMContentLoaded", async () => {
  await loadTranslations();
  initializePage("killmail_detail");
  await loadAndRenderKillmailPageContent();

  if (typeof window.AlphaStrike === 'undefined') {
    window.AlphaStrike = {};
  }
  window.AlphaStrike.onLanguageChangeRenderContent = onLanguageChange;

  hideLoading();
}); 