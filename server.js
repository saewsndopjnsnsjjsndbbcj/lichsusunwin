const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Thời gian giữa mỗi lần gọi API (ms)
const FETCH_INTERVAL_MS = 3000;

// ✅ Link API gốc (bạn có thể thay bằng link thật của bạn)
const API_URL = "https://sunwinsaygex.onrender.com/api/taixiu/history";

// Biến lưu phiên mới nhất
let latestResult = null;

// Hàm fetch dữ liệu định kỳ
async function fetchResult() {
    try {
        const response = await axios.get(API_URL);
        const json = response.data;

        // Kiểm tra cấu trúc dữ liệu hợp lệ
        if (json.state === 1 && json.data && json.data.OpenCode) {
            const openCodeStr = json.data.OpenCode;
            const openCode = openCodeStr.split(',').map(Number);

            if (openCode.length !== 3 || openCode.some(isNaN)) {
                console.error("❌ Lỗi dữ liệu OpenCode:", openCodeStr, "(Không hợp lệ)");
                return;
            }

            const tong = openCode.reduce((a, b) => a + b, 0);
            const ketQua = (tong >= 11) ? "Tài" : "Xỉu";

            latestResult = {
                phien: json.data.Expect,
                xuc_xac_1: openCode[0],
                xuc_xac_2: openCode[1],
                xuc_xac_3: openCode[2],
                tong: tong,
                ket_qua: ketQua,
                open_time: json.data.OpenTime
            };

            console.log(`🎲 Phiên ${latestResult.phien}: [${openCode.join(', ')}] = ${tong} 👉 ${ketQua}`);
        } else {
            console.warn("⚠️ Không có dữ liệu hợp lệ từ API:", json);
        }
    } catch (err) {
        console.error("❌ Lỗi khi fetch API:", err.message);
    } finally {
        // Lặp lại fetch sau mỗi 3 giây (dù thành công hay lỗi)
        setTimeout(fetchResult, FETCH_INTERVAL_MS);
    }
}

// Bắt đầu vòng lặp fetch
fetchResult();

// Endpoint xem kết quả mới nhất
app.get('/api/taixiu/ws', (req, res) => {
    if (!latestResult) {
        return res.status(503).json({
            error: "Dữ liệu chưa được nạp lần đầu.",
            note: "Vui lòng đợi vài giây để kết nối API nguồn."
        });
    }
    res.json(latestResult);
});

// Trang chủ
app.get('/', (req, res) => {
    res.send(`
        <h2>API Tài Xỉu đang chạy 🚀</h2>
        <p>Xem phiên mới nhất tại: <a href="/api/taixiu/ws">/api/taixiu/ws</a></p>
    `);
});

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
