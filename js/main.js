import { initializePage, displayDataInContainer } from "./common.js";
import { fetchRecentIncidents } from "./api.js";
import { toggleTimezone } from "./utils.js";
import { createIncidentCard } from "./incidentCard.js";
import { WebSocketManager } from "./websocket.js";
import {
  showLoading,
  hideLoading,
} from "./components/loadingOverlay.js";
// Page-specific initialization
showLoading();
document.addEventListener("DOMContentLoaded", async () => {
  initializePage("home");
  try {
    const data = await fetchRecentIncidents();
    displayDataInContainer(data, "data-container", createIncidentCard, {
      sortBy: "time_stamp",
      sortDirection: "desc",
      limit: 100,
      noDataMessage: "No recent incidents found.",
    });
  } catch (error) {
    document.getElementById("data-container").textContent =
      "Failed to load data.";
  }

  // Initialize WebSocket for live updates
  const wsManager = new WebSocketManager(
    "wss://api.alpha-strike.space/ws/mails",
    "data-container",
  );
  wsManager.connect();
  hideLoading();
}); 