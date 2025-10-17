const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// API gốc
const API_URL = "https://sunwinsaygex.onrender.com/api/taixiu/history";

// Lưu phiên mới nhất
let latestResult = null;

// Thời gian giữa các lần gọi API (3 giây)
const FETCH_INTERVAL_MS = 3000;

// Hàm lấy kết quả
async function fetchResult() {
  try {
    const response = await axios.get(API_URL);
    const json = response.data;

    // Kiểm tra dữ liệu hợp lệ
    if (json.state === 1 && json.data && json.data.OpenCode) {
      const openCodeStr = json.data.OpenCode;
      const openCode = openCodeStr.split(",").map(Number);

      if (openCode.length !== 3 || openCode.some(isNaN)) {
        console.error("❌ Lỗi dữ liệu OpenCode:", openCodeStr);
        return;
      }

      const tong = openCode.reduce((a, b) => a + b, 0);
      const ketQua = tong >= 11 ? "Tài" : "Xỉu";

      latestResult = {
        phien: json.data.Expect,
        xuc_xac_1: openCode[0],
        xuc_xac_2: openCode[1],
        xuc_xac_3: openCode[2],
        tong,
        ket_qua: ketQua,
        open_time: json.data.OpenTime,
      };

      console.log(`🎲 Phiên ${latestResult.phien} → ${latestResult.ket_qua}`);
    }
  } catch (err) {
    console.error(
      "❌ Lỗi fetch API:",
      err.message,
      err.response ? `(HTTP ${err.response.status})` : ""
    );
  } finally {
    // Gọi lại sau mỗi FETCH_INTERVAL_MS mili giây
    setTimeout(fetchResult, FETCH_INTERVAL_MS);
  }
}

// Bắt đầu gọi API
fetchResult();

// --- Endpoint trả dữ liệu phiên mới nhất ---
app.get("/api/taixiu/ws", (req, res) => {
  if (!latestResult) {
    return res.status(503).json({
      error: "Dữ liệu chưa được tải lần đầu. Vui lòng thử lại sau vài giây.",
    });
  }
  res.json(latestResult);
});

// Endpoint mặc định
app.get("/", (req, res) => {
  res.send(
    'API HTTP Tài Xỉu đang chạy.<br>👉 Truy cập <a href="/api/taixiu/ws">/api/taixiu/ws</a> để xem phiên mới nhất.'
  );
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
