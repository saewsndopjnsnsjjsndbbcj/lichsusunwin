const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 API gốc của bạn (Render cũ)
const API_URL = "https://sunwinsaygex.onrender.com/api/taixiu/history";

// Biến lưu phiên mới nhất
let latestResult = null;

// Thời gian chờ giữa mỗi lần gọi API (ms)
const FETCH_INTERVAL_MS = 3000;

// Hàm lấy dữ liệu từ API
async function fetchResult() {
  try {
    const response = await axios.get(API_URL);
    const data = response.data;

    // ✅ Kiểm tra dữ liệu hợp lệ và có ít nhất 1 phần tử
    if (Array.isArray(data) && data.length > 0) {
      const newest = data[0]; // Lấy phiên mới nhất

      // Chuẩn hóa dữ liệu
      latestResult = {
        phien: newest.phien,
        xuc_xac_1: newest.xuc_xac_1,
        xuc_xac_2: newest.xuc_xac_2,
        xuc_xac_3: newest.xuc_xac_3,
        tong: newest.tong,
        ket_qua: newest.ket_qua,
      };

      console.log(`🎲 Đã cập nhật phiên ${latestResult.phien} → ${latestResult.ket_qua}`);
    } else {
      console.warn("⚠️ API trả về dữ liệu rỗng hoặc không đúng định dạng.");
    }
  } catch (err) {
    console.error("❌ Lỗi khi fetch API:", err.message);
  } finally {
    // Lặp lại sau mỗi FETCH_INTERVAL_MS
    setTimeout(fetchResult, FETCH_INTERVAL_MS);
  }
}

// Chạy lần đầu
fetchResult();

// --- API trả dữ liệu phiên mới nhất ---
app.get("/api/taixiu/ws", (req, res) => {
  if (!latestResult) {
    return res.status(503).json({
      error: "Dữ liệu chưa được tải lần đầu. Vui lòng thử lại sau vài giây.",
    });
  }
  res.json(latestResult);
});

// Trang chủ test nhanh
app.get("/", (req, res) => {
  res.send(
    '✅ API đang chạy.<br>Truy cập <a href="/api/taixiu/ws">/api/taixiu/ws</a> để xem phiên mới nhất.'
  );
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
