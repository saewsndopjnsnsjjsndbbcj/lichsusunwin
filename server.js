// server.js - Tự động cập nhật cache mỗi 5 phút

const express = require("express");
const fetch = require("node-fetch");
const NodeCache = require("node-cache"); 

const app = express();
const PORT = process.env.PORT || 3000;

// URL API gốc
const API_URL = "https://ongmattroiahiihikiet-production.up.railway.app/api/taixiu/history";  

// Caching setup
const myCache = new NodeCache(); 
const CACHE_KEY = 'latest_taixiu_data';
// 5 phút * 60 giây * 1000 ms = 300,000 ms
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; 

// ----------------------------------------------------------------------
// --- 1. HÀM TỰ ĐỘNG CẬP NHẬT DỮ LIỆU (Tương đương "F5" mỗi 5 phút) ---
async function fetchAndUpdateCache() {
    console.log(`\n--- BẮT ĐẦU TÁC VỤ NỀN: Cập nhật dữ liệu từ API gốc (${new Date().toLocaleTimeString()}) ---`);
    try {
        const response = await fetch(API_URL, {
            // Thêm header để giả lập trình duyệt, tránh bị API chặn
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
            },
        });

        if (!response.ok) {
            console.error(`❌ Lỗi gọi API gốc: ${response.status} ${response.statusText}`);
            // Dừng nếu lỗi, chờ lần gọi tiếp theo sau 5 phút
            return; 
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            // Chỉ lưu vào cache nếu dữ liệu hợp lệ
            myCache.set(CACHE_KEY, data);
            console.log(`✅ Cập nhật cache thành công. Phiên mới nhất: ${data[0].session}`);
        } else {
            console.warn("⚠️ API gốc trả về dữ liệu rỗng hoặc không hợp lệ.");
        }

    } catch (error) {
        console.error(`❌ Lỗi kết nối trong tác vụ nền: ${error.message}`);
    }
    console.log("--- KẾT THÚC TÁC VỤ NỀN ---");
}

// ----------------------------------------------------------------------
// --- 2. API Endpoint: CHỈ ĐỌC TỪ CACHE (Phản hồi nhanh) ---
app.get("/api/taixiu", (req, res) => {
  const cachedData = myCache.get(CACHE_KEY);
  
  if (!cachedData) {
      // Trả về lỗi 503 nếu cache chưa kịp load lần đầu hoặc tác vụ nền đang bị lỗi
      return res.status(503).json({ 
          error: "Dữ liệu chưa sẵn sàng hoặc tác vụ cập nhật đang bị lỗi. Vui lòng thử lại sau vài giây."
      });
  }

  // Lấy dữ liệu từ cache và trả về kết quả phiên mới nhất
  const latest = cachedData[0]; 
  res.json({
    "Phien": latest.session,
    "Xuc_xac_1": latest.dice[0],
    "Xuc_xac_2": latest.dice[1],
    "Xuc_xac_3": latest.dice[2],
    "Tong": latest.total,
    "Ket_qua": latest.result
  });
});

// ----------------------------------------------------------------------
// --- 3. Server Startup: Khởi chạy tác vụ nền (Set up auto-refresh) ---
app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
  
  // A. Cập nhật lần đầu ngay khi server khởi động
  fetchAndUpdateCache();
  
  // B. Thiết lập bộ hẹn giờ để chạy lại MỖI 5 PHÚT
  // Đây là phần tạo ra hiệu ứng "F5 tự động"
  setInterval(fetchAndUpdateCache, REFRESH_INTERVAL_MS);
  console.log(`⏱️ Đã thiết lập tự động cập nhật mỗi 5 phút (${REFRESH_INTERVAL_MS}ms).`);
});
