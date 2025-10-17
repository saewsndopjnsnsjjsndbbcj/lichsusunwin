const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// URL API gốc (trả về danh sách lịch sử)
const API_URL = "https://sunwinsaygex.onrender.com/api/taixiu/history";

// Lưu phiên mới nhất
let latestResult = null;

// Hàm fetch chỉ lấy phiên mới nhất
async function fetchLatestResult() {
  try {
    const res = await axios.get(API_URL);
    const data = res.data;

    if (Array.isArray(data) && data.length > 0) {
      const newest = data[0]; // 🟢 Chỉ lấy phiên đầu tiên
      latestResult = {
        phien: newest.phien,
        xuc_xac_1: newest.xuc_xac_1,
        xuc_xac_2: newest.xuc_xac_2,
        xuc_xac_3: newest.xuc_xac_3,
        tong: newest.tong,
        ket_qua: newest.ket_qua
      };
      console.log(`✅ Cập nhật phiên mới nhất: ${latestResult.phien} (${latestResult.ket_qua})`);
    } else {
      console.warn("⚠️ Dữ liệu API không hợp lệ hoặc rỗng.");
    }
  } catch (err) {
    console.error("❌ Lỗi fetch API:", err.message);
  } finally {
    setTimeout(fetchLatestResult, 3000); // Lặp lại sau 3 giây
  }
}

// Gọi fetch lần đầu
fetchLatestResult();

// API: trả về 1 phiên mới nhất
app.get('/api/taixiu/ws', (req, res) => {
  if (!latestResult) {
    return res.status(503).json({ error: "Chưa có dữ liệu. Vui lòng thử lại sau." });
  }
  res.json(latestResult);
});

// Trang chủ test
app.get('/', (req, res) => {
  res.send(`
    <h2>API Tài Xỉu đang chạy ✅</h2>
    <p>Xem phiên mới nhất tại: <a href="/api/taixiu/ws">/api/taixiu/ws</a></p>
  `);
});

// Khởi chạy server
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`));
