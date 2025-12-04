const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// API lịch sử gốc
const API_HISTORY = "https://sunapi-hknam.onrender.com/api/his";

// 🔹 Trả về phiên mới nhất
app.get("/latest", async (req, res) => {
  try {
    const response = await axios.get(API_HISTORY);
    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(500).json({ error: "API gốc trả sai định dạng hoặc rỗng" });
    }

    // Lấy phiên mới nhất (phần tử đầu tiên của mảng)
    const newest = data[0];

    const latestResult = {
      Phien: newest.phien,
      Xuc_xac_1: newest.xuc_xac_1,
      Xuc_xac_2: newest.xuc_xac_2,
      Xuc_xac_3: newest.xuc_xac_3,
      Tong: newest.tong,
      Ket_qua: newest.ket_qua,
      id: "@mrtinhios"
    };

    res.json(latestResult);

  } catch (err) {
    console.error("Lỗi get latest:", err.message);
    res.status(500).json({ error: "Không lấy được phiên mới nhất" });
  }
});

// 🚀 Khởi động server
app.listen(PORT, () => {
  console.log(`API phiên mới nhất đang chạy tại http://localhost:${PORT}`);
});



