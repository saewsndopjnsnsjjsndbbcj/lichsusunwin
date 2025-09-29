// server.js - Phiên bản ổn định với Caching TTL 15 giây

const express = require("express");
const fetch = require("node-fetch"); // Đảm bảo node-fetch đã được cài đặt và có trong package.json
const NodeCache = require("node-cache"); // Đảm bảo node-cache đã được cài đặt và có trong package.json

const app = express();
const PORT = process.env.PORT || 3000;

// URL API đã được sửa
const API_URL = "https://ongmattroiahiihikiet-production.up.railway.app/api/taixiu/history";  

// Caching setup: TTL 15 giây (Cache sẽ tự động hết hạn sau 15 giây)
// Khi hết hạn, request tiếp theo sẽ kích hoạt việc gọi API gốc (fetch)
const myCache = new NodeCache({ stdTTL: 15, checkperiod: 5 }); 
const CACHE_KEY = 'latest_taixiu_data';

// --- API Endpoint ---
app.get("/api/taixiu", async (req, res) => {
  let latest;

  // 1. THỬ LẤY DỮ LIỆU TỪ CACHE
  const cachedData = myCache.get(CACHE_KEY);
  if (cachedData) {
      console.log("✅ Lấy dữ liệu từ Cache (còn hạn)...");
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

  // 2. NẾU KHÔNG CÓ CACHE (HOẶC HẾT HẠN), GỌI API GỐC
  try {
    const response = await fetch(API_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
        },
    });

    if (!response.ok) {
        // Xử lý lỗi 404/500 từ API gốc
        throw new Error(`Lỗi gọi API gốc: ${response.status} ${response.statusText} tại ${API_URL}`);
    }

    const data = await response.json(); 

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ error: "Không có dữ liệu hợp lệ từ API gốc" });
    }

    // 3. LƯU DỮ LIỆU VÀO CACHE và trả về
    myCache.set(CACHE_KEY, data);
    console.log(`💾 Cập nhật Cache mới. Hết hạn sau 15 giây. Phiên: ${data[0].session}`);
    
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
                          
