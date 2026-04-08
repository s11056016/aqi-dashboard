const stationSelect = document.getElementById("stationSelect");
const loadBtn = document.getElementById("loadBtn");
const monitorBtn = document.getElementById("monitorBtn");
const stopBtn = document.getElementById("stopBtn");
const exportBtn = document.getElementById("exportBtn");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");

const aqiValue = document.getElementById("aqiValue");
const statusText = document.getElementById("statusText");
const errorBox = document.getElementById("errorBox");
const chartCanvas = document.getElementById("aqiChart");

let allData = [];
let monitorTimer = null;
let aqiChart = null;
let historyData = JSON.parse(localStorage.getItem("aqiHistory")) || [];

document.addEventListener("DOMContentLoaded", async () => {
    initChart();
    await fetchAQIData(true);
});

loadBtn.addEventListener("click", async () => {
    await fetchAQIData(false);
});

monitorBtn.addEventListener("click", startMonitoring);
stopBtn.addEventListener("click", stopMonitoring);
exportBtn.addEventListener("click", exportCSV);
downloadBtn.addEventListener("click", downloadChart);
clearBtn.addEventListener("click", clearHistory);
stationSelect.addEventListener("change", updateDisplay);

async function fetchAQIData(isInitialLoad = false) {
    hideError();

    try {
        const response = await fetch("/api/aqi");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(`${data.error || "抓取失敗"}\n${data.detail || ""}`);
        }

        if (!Array.isArray(data.records) || data.records.length === 0) {
            throw new Error("目前沒有取得任何測站資料");
        }

        allData = data.records.filter(item => item.sitename && item.aqi !== "");

        if (isInitialLoad || stationSelect.options.length <= 1) {
            renderStationOptions(allData);
        }

        updateDisplay();

    } catch (err) {
        console.error("前端錯誤：", err);
        showError(err.message);
    }
}

function renderStationOptions(data) {
    const previousValue = stationSelect.value;
    stationSelect.innerHTML = "";

    data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.sitename;
        option.textContent = `${item.county} - ${item.sitename}`;
        stationSelect.appendChild(option);
    });

    if (previousValue && data.some(item => item.sitename === previousValue)) {
        stationSelect.value = previousValue;
    }
}

function updateDisplay() {
    const selectedSite = stationSelect.value;

    if (!selectedSite) {
        aqiValue.textContent = "--";
        statusText.textContent = "請先選擇監測站";
        aqiValue.className = "aqi-value";
        return;
    }

    const siteInfo = allData.find(item => item.sitename === selectedSite);

    if (!siteInfo) {
        aqiValue.textContent = "--";
        statusText.textContent = "找不到測站資料";
        aqiValue.className = "aqi-value";
        return;
    }

    const aqi = parseInt(siteInfo.aqi, 10) || 0;

    aqiValue.textContent = aqi;
    statusText.textContent = `測站：${siteInfo.county} - ${siteInfo.sitename}｜更新時間：${siteInfo.publishtime}`;
    aqiValue.className = "aqi-value";

    if (aqi <= 50) {
        aqiValue.classList.add("good");
    } else if (aqi <= 100) {
        aqiValue.classList.add("normal");
    } else if (aqi <= 150) {
        aqiValue.classList.add("bad");
    } else {
        aqiValue.classList.add("very-bad");
    }

    addHistoryRecord(siteInfo);
}

function addHistoryRecord(siteInfo) {
    const record = {
        time: new Date().toLocaleTimeString("zh-TW", { hour12: false }),
        site: siteInfo.sitename,
        county: siteInfo.county,
        value: parseInt(siteInfo.aqi, 10) || 0
    };

    const selectedSite = stationSelect.value;

    historyData.push(record);

    historyData = historyData
        .filter(item => item.site === selectedSite)
        .slice(-20);

    localStorage.setItem("aqiHistory", JSON.stringify(historyData));
    updateChart();
}

function initChart() {
    aqiChart = new Chart(chartCanvas, {
        type: "line",
        data: {
            labels: historyData.map(item => item.time),
            datasets: [
                {
                    label: "AQI 指數",
                    data: historyData.map(item => item.value),
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateChart() {
    if (!aqiChart) return;

    aqiChart.data.labels = historyData.map(item => item.time);
    aqiChart.data.datasets[0].data = historyData.map(item => item.value);
    aqiChart.update();
}

function startMonitoring() {
    if (!stationSelect.value) {
        showError("請先選擇監測站");
        return;
    }

    if (monitorTimer) return;

    monitorBtn.textContent = "監控中...";
    monitorBtn.disabled = true;

    monitorTimer = setInterval(async () => {
        await fetchAQIData(false);
    }, 60000);
}

function stopMonitoring() {
    if (monitorTimer) {
        clearInterval(monitorTimer);
        monitorTimer = null;
    }

    monitorBtn.textContent = "開始監控";
    monitorBtn.disabled = false;
}

function exportCSV() {
    if (historyData.length === 0) {
        showError("目前沒有可匯出的歷史資料");
        return;
    }

    const csvRows = [
        ["時間", "縣市", "測站", "AQI"],
        ...historyData.map(item => [item.time, item.county, item.site, item.value])
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "aqi_history.csv";
    link.click();
}

function downloadChart() {
    if (!aqiChart) return;

    const link = document.createElement("a");
    link.href = chartCanvas.toDataURL("image/png");
    link.download = "aqi_chart.png";
    link.click();
}

function clearHistory() {
    historyData = [];
    localStorage.removeItem("aqiHistory");
    updateChart();
}

function showError(message) {
    errorBox.textContent = `錯誤原因：\n${message}`;
    errorBox.classList.remove("hidden");
}

function hideError() {
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
}