import { showLoading, hideLoading } from "/js/components/loadingOverlay.js";
import { initializePage } from './common.js';
// Import the new function specifically
import { fetchAndDisplayMetric, updateRollingAverageHeaderText } from './monthly-tables.js';
import { loadTranslations } from './translation-dictionary.js';

showLoading();

document.addEventListener("DOMContentLoaded", async () => {
    await loadTranslations(); // Ensure translations are loaded first

    let currentMetric = "top_killers";
    let tableId = "killerTable";
    let currentTimeRange = 'month'; // Variable to store the current time range

    // Determine currentMetric and tableId (if dynamic for the page)
    if (document.body.contains(document.getElementById("systemTable"))) {
        currentMetric = "top_systems";
        tableId = "systemTable";
    } else if (document.body.contains(document.getElementById("victimTable"))) {
        currentMetric = "top_victims";
        tableId = "victimTable";
    }

    initializePage(currentMetric.replace('top_', ''));

    function updateActiveButtonStates(activeRange) {
        const buttons = document.querySelectorAll('.time-range-btn');
        buttons.forEach(button => {
            if (button.dataset.range === activeRange) {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        });
    }

    function loadMetricData(timeRange) {
        currentTimeRange = timeRange; // Update the stored current time range
        updateActiveButtonStates(timeRange); // Update button UI
        fetchAndDisplayMetric(currentMetric, tableId, timeRange); // This will also set the header
    }

    const timeRangeButtons = document.querySelectorAll('.time-range-btn');
    timeRangeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedRange = button.getAttribute('data-range');
            loadMetricData(selectedRange);
        });
    });

    loadMetricData(currentTimeRange); // Initial load, default to 'month'

    // Setup callback for language changes
    if (typeof window.AlphaStrike === 'undefined') {
        window.AlphaStrike = {};
    }
    window.AlphaStrike.onLanguageChangeRenderContent = () => {
        console.log(`Language change detected on ${currentMetric} page. Updating header for timeRange: ${currentTimeRange}`);
        // Call the new function to only update the header text
        updateRollingAverageHeaderText(currentTimeRange);
        // Note: The main setLanguage in translation-dictionary.js will handle other data-translate elements.
    };
    hideLoading();
}); 