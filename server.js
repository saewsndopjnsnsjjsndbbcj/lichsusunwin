// server.js - Phiên bản cuối cùng đã tối ưu

const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache"); 

const app = express();
const PORT = process.env.PORT || 3000;

// Link API gốc (Bạn cần đảm bảo link này hoạt động)
const API_URL = "https://ongmattroiahihihiet-produc.railway.app/api/taixiu/history";  

// Caching setup
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

  // 2. NẾU KHÔNG CÓ CACHE, GỌI API GỐC
  try {
    const response = await axios.get(API_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
        },
        maxRedirects: 5 
    });

    const data = response.data; 

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ error: "Không có dữ liệu hợp lệ từ API gốc" });
    }

    // 3. LƯU DỮ LIỆU VÀO CACHE
    myCache.set(CACHE_KEY, data);
    console.log("💾 Cập nhật Cache mới. Hết hạn sau 15 giây.");

    // 4. TRẢ VỀ PHIÊN MỚI NHẤT VỚI ĐỊNH DẠNG CHUẨN MỚI
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
    const status = error.response ? error.response.status : 500;
    const statusText = error.response ? error.response.statusText : 'Internal Error';
    const errorMessage = error.response 
      ? `Lỗi gọi API gốc: ${status} ${statusText}` 
      : `Lỗi kết nối: ${error.message}`;
      
    console.error(`❌ Lỗi gọi API gốc: ${errorMessage}`);
    res.status(500).json({ error: errorMessage });
  }
});

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});
      
