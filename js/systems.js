import { showLoading, hideLoading } from "/js/components/loadingOverlay.js";
import { initializePage } from './common.js';
import { fetchAndDisplayMetric, updateRollingAverageHeaderText } from './monthly-tables.js';
import { loadTranslations } from './translation-dictionary.js';

showLoading();

document.addEventListener("DOMContentLoaded", async () => {
    await loadTranslations();

    let currentMetric = "top_systems";
    let tableId = "systemTable";
    let currentTimeRange = 'month';

    initializePage('systems');

    function updateActiveButtonStates(activeRange) {
        document.querySelectorAll('.time-range-btn').forEach(button => {
            button.classList.toggle("active", button.dataset.range === activeRange);
        });
    }

    function loadMetricData(timeRange) {
        currentTimeRange = timeRange;
        updateActiveButtonStates(timeRange);
        fetchAndDisplayMetric(currentMetric, tableId, timeRange);
    }

    document.querySelectorAll('.time-range-btn').forEach(button => {
        button.addEventListener('click', () => {
            loadMetricData(button.dataset.range);
        });
    });

    loadMetricData(currentTimeRange);

    if (typeof window.AlphaStrike === 'undefined') {
        window.AlphaStrike = {};
    }
    window.AlphaStrike.onLanguageChangeRenderContent = () => {
        updateRollingAverageHeaderText(currentTimeRange);
    };
    
    hideLoading();
}); 