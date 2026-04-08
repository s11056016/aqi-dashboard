# AQI 即時監控系統

## 專案簡介
本專案是一套以前後端分離方式開發的 AQI 即時監控系統，透過串接環境部空氣品質資料 API，讓使用者能夠查詢特定測站的 AQI 指數，並於前端即時顯示當前數值、更新時間，以及歷史數據圖表。  
後端使用 Node.js 與 Express 建立 API proxy，協助處理資料請求與錯誤回傳；前端則使用 HTML、CSS、JavaScript 與 Chart.js 建立互動式介面與資料視覺化功能。

---

## 功能特色
- 查詢特定測站的 AQI 指數
- 即時顯示當前 AQI 數值
- 顯示最新更新時間
- 歷史數據折線圖呈現
- 支援開始 / 停止監控
- 支援匯出 CSV
- 支援下載圖表
- 支援錯誤訊息顯示

---

## 系統架構
```text
前端（HTML / CSS / JavaScript）
        ↓
   fetch("/api/aqi")
        ↓
後端（Node.js / Express）
        ↓
環境部空氣品質 API