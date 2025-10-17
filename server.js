import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 Firebase Realtime Database URL (đổi nếu bạn dùng DB khác)
const FIREBASE_URL = "https://gb-8e4c1-default-rtdb.firebaseio.com/taixiu_sessions/current.json";

// 🚀 Route duy nhất: /history
app.get("/history", async (req, res) => {
  try {
    const response = await fetch(FIREBASE_URL);
    if (!response.ok) throw new Error("Lỗi khi truy cập Firebase");

    const data = await response.json();
    if (!data) return res.status(404).json({ message: "Không có phiên nào trong lịch sử." });

    // Chuẩn hóa dữ liệu về đúng định dạng bạn muốn
    const formatted = {
      Phien: data.Phien?.toString() || "",
      Xuc_xac_1: data.xuc_xac_1 || data.Xuc_xac_1 || 0,
      Xuc_xac_2: data.xuc_xac_2 || data.Xuc_xac_2 || 0,
      Xuc_xac_3: data.xuc_xac_3 || data.Xuc_xac_3 || 0,
      Tong: data.tong || data.Tong || 0,
      Ket_qua: data.ket_qua || data.Ket_qua || "",
      Thoi_gian: data.thoi_gian || data.Thoi_gian || "",
    };

    res.json(formatted);
  } catch (err) {
    console.error("❌ Lỗi khi lấy dữ liệu:", err);
    res.status(500).json({ error: "Không thể tải dữ liệu từ Firebase." });
  }
});

// Trang chủ (tuỳ chọn, chỉ để test)
app.get("/", (req, res) => {
  res.send(`<h3>Server đang chạy! Dùng đường dẫn <a href="/history">/history</a> để xem dữ liệu.</h3>`);
});

app.listen(PORT, () => console.log(`✅ Server đang chạy tại cổng ${PORT}`));
