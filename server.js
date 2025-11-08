const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 API nguồn dữ liệu thật
const API_URL = "http://139.59.120.117:3001";

// Lưu kết quả hiện tại
let latestResult = null;
let lastPhien = null;

// Thời gian mỗi lần kiểm tra (ms)
const FETCH_INTERVAL_MS = 3000;

// 🔁 Hàm lấy dữ liệu mới nhất
async function fetchResult() {
  try {
    const response = await axios.get(API_URL);
    const data = response.data;

    // Nếu API trả về đúng form
    if (data && data.Phien) {
      if (data.Phien !== lastPhien) {
        // Có phiên mới
        latestResult = data;
        lastPhien = data.Phien;

        console.log(`🎲 [NEW] Phiên ${data.Phien} → ${data.Ket_qua}`);
      } else {
        // Phiên trùng, không log, không cập nhật
      }
    } else if (Array.isArray(data) && data.length > 0) {
      // Nếu API trả mảng, lấy phần tử đầu
      const newest = data[0];
      if (newest.phien !== lastPhien) {
        latestResult = {
          Phien: newest.phien,
          Xuc_xac_1: newest.xuc_xac_1,
          Xuc_xac_2: newest.xuc_xac_2,
          Xuc_xac_3: newest.xuc_xac_3,
          Tong: newest.tong,
          Ket_qua: newest.ket_qua,
          id: "@mrtinhios",
        };
        lastPhien = newest.phien;
        console.log(`🎲 [NEW] Phiên ${latestResult.Phien} → ${latestResult.Ket_qua}`);
      }
    } else {
      console.warn("⚠️ API trả sai định dạng hoặc rỗng.");
    }
  } catch (err) {
    console.error("❌ Lỗi fetch:", err.message);
  } finally {
    // Lặp lại
    setTimeout(fetchResult, FETCH_INTERVAL_MS);
  }
}

// Chạy lần đầu
fetchResult();

// 🟢 API chính (trả phiên mới nhất)
app.get("/", (req, res) => {
  if (!latestResult) {
    return res.status(503).json({
      error: "Dữ liệu chưa tải lần đầu. Vui lòng chờ vài giây.",
    });
  }
  res.json(latestResult);
});

// 🚀 Khởi động server
app.listen(PORT, () => {
  console.log(`✅ Server trung gian đang chạy tại http://localhost:${PORT}`);
});
