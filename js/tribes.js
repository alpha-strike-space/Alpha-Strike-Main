import { showLoading, hideLoading } from "/js/components/loadingOverlay.js";
import { initializePage } from './common.js';
import { fetchAndDisplayMetric, updateRollingAverageHeaderText } from './monthly-tables.js';
import { loadTranslations } from './translation-dictionary.js';

showLoading();

document.addEventListener("DOMContentLoaded", async () => {
    await loadTranslations();

    let currentMetric = "top_tribes";
    let tableId = "tribeTable";
    let currentTimeRange = 'month';

    initializePage('tribes');

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
        currentTimeRange = timeRange;
        updateActiveButtonStates(timeRange);
        fetchAndDisplayMetric(currentMetric, tableId, timeRange);
    }

    const timeRangeButtons = document.querySelectorAll('.time-range-btn');
    timeRangeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedRange = button.getAttribute('data-range');
            loadMetricData(selectedRange);
        });
    });

    loadMetricData(currentTimeRange);

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