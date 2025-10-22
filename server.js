const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 API nguồn của bạn
const API_URL = "https://sunwinsaygex-ew87.onrender.com/api/taixiu/history";

// Biến lưu kết quả mới nhất
let latestResult = null;

// Thời gian giữa mỗi lần gọi API (ms)
const FETCH_INTERVAL_MS = 3000;

// 🔁 Hàm lấy dữ liệu từ API
async function fetchResult() {
  try {
    const response = await axios.get(API_URL);
    const data = response.data;

    if (Array.isArray(data) && data.length > 0) {
      const newest = data[0]; // Lấy phiên mới nhất

      latestResult = {
        phien: newest.phien,
        xuc_xac_1: newest.xuc_xac_1,
        xuc_xac_2: newest.xuc_xac_2,
        xuc_xac_3: newest.xuc_xac_3,
        tong: newest.tong,
        ket_qua: newest.ket_qua,
      };

      console.log(`🎲 Cập nhật phiên ${latestResult.phien} → ${latestResult.ket_qua}`);
    } else {
      console.warn("⚠️ API trả về dữ liệu rỗng hoặc không đúng định dạng.");
    }
  } catch (err) {
    console.error("❌ Lỗi khi fetch API:", err.message);
  } finally {
    setTimeout(fetchResult, FETCH_INTERVAL_MS);
  }
}

// Chạy lần đầu
fetchResult();

// 🟢 Trang chủ — hiển thị luôn dữ liệu JSON mới nhất
app.get("/", (req, res) => {
  if (!latestResult) {
    return res.status(503).json({
      error: "Dữ liệu chưa được tải lần đầu. Vui lòng thử lại sau vài giây.",
    });
  }
  res.json(latestResult);
});

// 🔵 API riêng nếu muốn test hoặc dùng ở nơi khác
app.get("/api/taixiu/ws", (req, res) => {
  if (!latestResult) {
    return res.status(503).json({
      error: "Dữ liệu chưa được tải lần đầu. Vui lòng thử lại sau vài giây.",
    });
  }
  res.json(latestResult);
});

// 🚀 Khởi động server
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});

