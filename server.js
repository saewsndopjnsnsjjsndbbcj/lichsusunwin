// server.js - Đã chuyển sang Node-Fetch để vượt qua lỗi 404
const express = require("express");
const fetch = require("node-fetch"); // <-- Dùng node-fetch
const NodeCache = require("node-cache"); 

const app = express();
const PORT = process.env.PORT || 3000;

// Link API gốc (Đã xác nhận là chuẩn)
const API_URL = "https://ongmattroiahiihikiet-production.up.railway.app/api/taixiu/history";  

// Caching setup
const myCache = new NodeCache({ stdTTL: 15, checkperiod: 5 }); 
const CACHE_KEY = 'latest_taixiu_data';

// --- API Endpoint ---
app.get("/api/taixiu", async (req, res) => {
  let latest;

  // 1. THỬ LẤY DỮ LIỆU TỪ CACHE (Logic không đổi)
  const cachedData = myCache.get(CACHE_KEY);
  if (cachedData) {
      latest = cachedData[0];
      return res.json({
        "Phien": latest.session,
        "Xuc_xac_1": latest.dice[0],
        "Xuc_xac_2": latest.dice[1],
        "Xuc_xac_3": latest.dice[2],
        "Tong": latest.total,
        "Ket_qua": latest.result
      });
  }

  // 2. GỌI API GỐC BẰNG NODE-FETCH
  try {
    const response = await fetch(API_URL, {
        // Thêm User-Agent mạnh hơn
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
        },
    });

    // QUAN TRỌNG: Kiểm tra lỗi 404 bằng response.ok
    if (!response.ok) {
        // Nếu API gốc cố tình trả về 404 để chặn server
        throw new Error(`Lỗi gọi API gốc: ${response.status} ${response.statusText}`);
    }

    const data = await response.json(); // <-- Dùng .json() với fetch

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ error: "Không có dữ liệu hợp lệ từ API gốc" });
    }

    // 3. LƯU VÀ TRẢ VỀ KẾT QUẢ (Logic không đổi)
    myCache.set(CACHE_KEY, data);
    latest = data[0]; 

    res.json({
      "Phien": latest.session,
      "Xuc_xac_1": latest.dice[0],
      "Xuc_xac_2": latest.dice[1],
      "Xuc_xac_3": latest.dice[2],
      "Tong": latest.total,
      "Ket_qua": latest.result
    });

  } catch (error) {
    // Xử lý lỗi
    console.error(`❌ Lỗi gọi API: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});
  
