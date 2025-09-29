const express = require("express"); // SỬA LỖI Ở ĐÂY
const fetch = require("node-fetch"); // THÊM DÒNG NÀY NẾU BẠN CHƯA CÓ FETCH GỐC TRONG MÔI TRƯỜNG NODE.JS CỦA BẠN

const app = express();
const PORT = process.env.PORT || 3000;

// Link API gốc (theo ảnh chụp màn hình)
const API_URL = "https://ongmattroiahihihiet-produc.railway.app/api/taixiu/history";  

app.get("/api/taixiu", async (req, res) => {
  try {
    // Đảm bảo bạn có sẵn 'fetch' hoặc đã cài 'node-fetch'
    const response = await fetch(API_URL);
    
    if (!response.ok) {
        console.error(`Lỗi gọi API gốc: ${response.status} ${response.statusText}`);
        throw new Error("Không thể gọi API gốc");
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ error: "Không có dữ liệu" });
    }

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
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});
