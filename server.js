// server.js - Đã cập nhật URL API mới nhất

const express = require("express");
const fetch = require("node-fetch"); // Đảm bảo bạn đã cài node-fetch@2.6.7
const NodeCache = require("node-cache"); 

const app = express();
const PORT = process.env.PORT || 3000;

// Đã cập nhật URL API mới bạn cung cấp
const API_URL = "https://ongmattroiahiihikiet-production.up.railway.app/api/taixiu/history";  

// Caching setup
const myCache = new NodeCache({ stdTTL: 15, checkperiod: 5 }); 
const CACHE_KEY = 'latest_taixiu_data';

// --- API Endpoint ---
app.get("/api/taixiu", async (req, res) => {
  let latest;

  // 1. THỬ LẤY DỮ LIỆU TỪ CACHE
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

  // 2. GỌI API GỐC BẰNG NODE-FETCH VỚI URL MỚI
  try {
    const response = await fetch(API_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
        },
    });

    if (!response.ok) {
        // Lỗi sẽ hiển thị URL mới nếu vẫn gặp 404
        throw new Error(`Lỗi gọi API gốc: ${response.status} ${response.statusText} tại ${API_URL}`);
    }

    const data = await response.json(); 

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ error: "Không có dữ liệu hợp lệ từ API gốc" });
    }

    // 3. LƯU VÀ TRẢ VỀ KẾT QUẢ
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
    console.error(`❌ Lỗi gọi API: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});
        
