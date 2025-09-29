const express = require("express");
const axios = require("axios"); // <--- THAY THẾ node-fetch
const NodeCache = require("node-cache"); // <--- Thêm NodeCache

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo cache với thời gian sống (TTL) là 15 giây
// Giúp giảm số lần gọi API gốc nếu có nhiều request
const myCache = new NodeCache({ stdTTL: 15, checkperiod: 5 }); 

// Link API gốc (theo ảnh chụp màn hình)
const API_URL = "https://ongmattroiahihihiet-produc.railway.app/api/taixiu/history";  

app.get("/api/taixiu", async (req, res) => {
  // Bỏ qua caching để luôn lấy dữ liệu mới nhất nếu cần, 
  // nhưng nếu bạn muốn caching thì hãy uncomment các dòng dưới
  /*
  const cacheKey = 'latest_taixiu';
  let data = myCache.get(cacheKey);

  if (data) {
      console.log("Lấy dữ liệu từ Cache...");
      const latest = data[0];
      return res.json({
        Phien: latest.session,
        Xuc_xac_1: latest.dice[0],
        Xuc_xac_2: latest.dice[1],
        Xuc_xac_3: latest.dice[2],
        Tong: latest.total,
        Ket_qua: latest.result
      });
  }
  */

  try {
    // SỬ DỤNG AXIOS
    const response = await axios.get(API_URL);
    const data = response.data; // <--- Dữ liệu nằm trong response.data với Axios

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ error: "Không có dữ liệu" });
    }

    // myCache.set(cacheKey, data); // Lưu vào Cache

    const latest = data[0]; // phiên mới nhất

    res.json({
      Phien: latest.session,
      Xuc_xac_1: latest.dice[0],
      Xuc_xac_2: latest.dice[1],
      Xuc_xac_3: latest.dice[2],
      Tong: latest.total,
      Ket_qua: latest.result
    });
  } catch (error) {
    // Axios đặt thông tin lỗi khác với Fetch
    const errorMessage = error.response ? `Lỗi API gốc: ${error.response.status} ${error.response.statusText}` : error.message;
    console.error(errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});
