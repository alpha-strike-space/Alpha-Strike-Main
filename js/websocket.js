import { createIncidentCard, addIncidentCardListeners } from "./incidentCard.js";
import { setLanguage } from "./translation-dictionary.js";

/**
 * WebSocket connection manager for live updates
 */
export class WebSocketManager {
  constructor(url, containerId) {
    this.url = url;
    this.containerId = containerId;
    this.ws = null;
    this.reconnectDelay = 5000;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.scheduleReconnect();
    }
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log("WebSocket connection established.");
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.log(
        `WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`,
      );
      this.scheduleReconnect();
    };
  }

  handleMessage(event) {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      console.log(
        "WebSocket received non-JSON message or malformed JSON:",
        event.data,
      );
      return;
    }
    // Check if the data contains the expected incident structure
    if (
      typeof data === "object" &&
      data !== null &&
      (Object.prototype.hasOwnProperty.call(data, "killer_name") ||
        Object.prototype.hasOwnProperty.call(data, "victim_name") ||
        Object.prototype.hasOwnProperty.call(data, "time_stamp"))
    ) {
      // It looks like an incident, proceed to add it.
      this.addNewIncident(data);
    } else {
      // It's valid JSON, but not structured like an incident we expect.
      console.log(
        "WebSocket received valid JSON, but not recognized as an incident:",
        data,
      );
    }
  }

  addNewIncident(item) {
    const container = document.getElementById(this.containerId);
    if (container) {
      const card = createIncidentCard(item);
      if (card) {
        // Check if card is valid
        container.insertBefore(card, container.firstChild);
        setLanguage(localStorage.getItem('preferredLanguage') || 'en');
        addIncidentCardListeners();
      } else {
        console.warn(
          "Websocket: Incident item did not result in a displayable card:",
          item,
        );
      }
    } else {
      console.error(
        `WebSocket: Container with ID ${this.containerId} not found for new incident.`,
      );
    }
  }

  scheduleReconnect() {
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close(1000, "Client initiated disconnect");
      this.ws = null;
      console.log("WebSocket connection intentionally closed.");
    }
  }
}
