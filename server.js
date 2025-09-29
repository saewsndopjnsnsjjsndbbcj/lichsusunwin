// server.js

// 1. Cú pháp CommonJS để tránh lỗi "SyntaxError: Unexpected identifier 'express'"
const express = require("express");
const axios = require("axios"); // Gói bạn đã cài đặt trong package.json
const NodeCache = require("node-cache"); // Gói bạn đã cài đặt

const app = express();
const PORT = process.env.PORT || 3000;

// Link API gốc (theo ảnh chụp màn hình, nhưng bạn cần đảm bảo nó còn hoạt động)
// LƯU Ý QUAN TRỌNG: Lỗi 404 trước đó có thể do URL này đã chết. 
// Nếu vẫn lỗi, bạn phải thay bằng một link API Tài Xỉu khác đang hoạt động.
const API_URL = "https://ongmattroiahihihiet-produc.railway.app/api/taixiu/history";  

// Khởi tạo cache với thời gian sống (TTL) là 15 giây.
// Sau 15s, dữ liệu sẽ được làm mới bằng cách gọi API gốc.
const myCache = new NodeCache({ stdTTL: 15, checkperiod: 5 }); 
const CACHE_KEY = 'latest_taixiu_data';

// --- API Endpoint ---
app.get("/api/taixiu", async (req, res) => {
  let data;
  let latest;

  // 1. THỬ LẤY DỮ LIỆU TỪ CACHE
  const cachedData = myCache.get(CACHE_KEY);
  if (cachedData) {
      console.log("✅ Lấy dữ liệu từ Cache (còn hạn)...");
      latest = cachedData[0];
      return res.json({
        Phien: latest.session,
        Xuc_xac_1: latest.dice[0],
        Xuc_xac_2: latest.dice[1],
        Xuc_xac_3: latest.dice[2],
        Tong: latest.total,
        Ket_qua: latest.result
      });
  }

  // 2. NẾU KHÔNG CÓ CACHE (hoặc hết hạn), GỌI API GỐC
  try {
    const response = await axios.get(API_URL);
    data = response.data; // Axios trả về dữ liệu trong .data

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ error: "Không có dữ liệu từ API gốc" });
    }

    // 3. LƯU DỮ LIỆU MỚI VÀO CACHE
    myCache.set(CACHE_KEY, data);
    console.log("💾 Cập nhật Cache mới. Hết hạn sau 15 giây.");

    // 4. TRẢ VỀ PHIÊN MỚI NHẤT
    latest = data[0]; 

    res.json({
      Phien: latest.session,
      Xuc_xac_1: latest.dice[0],
      Xuc_xac_2: latest.dice[1],
      Xuc_xac_3: latest.dice[2],
      Tong: latest.total,
      Ket_qua: latest.result
    });
  } catch (error) {
    // Xử lý lỗi Axios và trả về lỗi 500
    const errorMessage = error.response 
      ? `Lỗi gọi API gốc: ${error.response.status} ${error.response.statusText}` 
      : error.message;
      
    console.error(`❌ Lỗi gọi API gốc: ${errorMessage}`);
    res.status(500).json({ error: errorMessage });
  }
});

// --- Server Startup ---
app.listen(PORT, () => {
  // Dòng này hoạt động cả khi chạy local và khi deploy
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});
      
