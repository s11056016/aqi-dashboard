const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

app.use(express.static("public"));

app.get("/api/aqi", async (req, res) => {
    try {
        const url = "https://data.moenv.gov.tw/api/v2/aqx_p_432?api_key=b59885ac-443b-4844-b913-9a6df7eac208&limit=1000&sort=ImportDate%20desc&format=json";

        console.log("正在向外部 API 抓資料：", url);

        const response = await fetch(url);
        const rawText = await response.text();

        console.log("外部 API 狀態碼：", response.status);
        console.log("外部 API 回傳前 300 字：", rawText.slice(0, 300));

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: "外部 API 回應失敗",
                status: response.status,
                detail: rawText
            });
        }

        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            return res.status(500).json({
                success: false,
                error: "外部 API JSON 解析失敗",
                detail: rawText
            });
        }

        const records = Array.isArray(data) ? data : (data.records || []);

        return res.json({
            success: true,
            records: records
        });

    } catch (err) {
        console.error("伺服器錯誤：", err);
        return res.status(500).json({
            success: false,
            error: "伺服器抓取資料失敗",
            detail: err.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`伺服器已啟動：http://localhost:${PORT}`);
});