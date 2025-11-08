const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 API gốc (nguồn thật)
const API_URL = "http://139.59.120.117:3001";

// Biến lưu kết quả mới nhất
let latestResult = null;

// Thời gian cập nhật (ms)
const FETCH_INTERVAL_MS = 3000;

// 🔁 Hàm lấy dữ liệu từ API gốc
async function fetchResult() {
  try {
    const response = await axios.get(API_URL);
    const data = response.data;

    // ✅ Nếu API gốc đã trả đúng form thì chỉ cần giữ nguyên
    if (data && data.Phien && data.Ket_qua) {
      latestResult = data;
      console.log(`🎯 Nhận phiên ${data.Phien} → ${data.Ket_qua}`);
    } else if (Array.isArray(data) && data.length > 0) {
      // ✅ Nếu API gốc trả dạng mảng thì lấy phần tử đầu và convert
      const newest = data[0];
      latestResult = {
        Phien: newest.phien,
        Xuc_xac_1: newest.xuc_xac_1,
        Xuc_xac_2: newest.xuc_xac_2,
        Xuc_xac_3: newest.xuc_xac_3,
        Tong: newest.tong,
        Ket_qua: newest.ket_qua,
        id: "@mrtinhios",
      };
      console.log(`🎲 Cập nhật phiên ${latestResult.Phien} → ${latestResult.Ket_qua}`);
    } else {
      console.warn("⚠️ API gốc trả về dữ liệu rỗng hoặc sai định dạng.");
    }
  } catch (err) {
    console.error("❌ Lỗi fetch API gốc:", err.message);
  } finally {
    setTimeout(fetchResult, FETCH_INTERVAL_MS);
  }
}

// Gọi lần đầu
fetchResult();

// 🟢 Route chính: trả form JSON lịch sử
app.get("/", (req, res) => {
  if (!latestResult) {
    return res.status(503).json({
      error: "Dữ liệu chưa được tải lần đầu. Vui lòng thử lại sau vài giây.",
    });
  }
  res.json(latestResult);
});

// 🚀 Chạy server trung gian
app.listen(PORT, () => {
  console.log(`✅ Server trung gian đang chạy tại http://localhost:${PORT}`);
});
