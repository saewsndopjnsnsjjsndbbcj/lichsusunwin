Import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Link API gốc (đã thay đổi theo link trong ảnh chụp màn hình)
const API_URL = "https://ongmattroiahihihiet-produc.railway.app/api/taixiu/history";  

app.get("/api/taixiu", async (req, res) => {
  try {
    const response = await fetch(API_URL);
    
    // Đảm bảo response.ok là bước cực kỳ quan trọng
    if (!response.ok) {
        // Có thể log thêm response.status để dễ debug
        console.error(`Lỗi gọi API gốc: ${response.status} ${response.statusText}`);
        throw new Error("Không thể gọi API gốc");
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.json({ error: "Không có dữ liệu" });
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
    // Trả về lỗi 500 nếu là lỗi server (Internal Server Error)
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  // Dòng này chỉ chạy khi chạy local. Khi deploy, nó vẫn ổn.
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});
