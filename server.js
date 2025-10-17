const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// API gốc (bạn thay bằng link thật nếu muốn)
const API_URL = "https://sunwinsaygex.onrender.com/api/taixiu/history";

// Thời gian giữa mỗi lần cập nhật (ms)
const FETCH_INTERVAL = 3000;

// Lưu phiên mới nhất
let latestResult = null;

// Hàm fetch dữ liệu từ API gốc
async function fetchLatest() {
    try {
        const res = await axios.get(API_URL);
        const data = res.data;

        if (data.state === 1 && data.data && data.data.OpenCode) {
            const dices = data.data.OpenCode.split(',').map(Number);
            if (dices.length !== 3 || dices.some(isNaN)) return;

            const total = dices.reduce((a, b) => a + b, 0);
            const result = total >= 11 ? "Tài" : "Xỉu";

            latestResult = {
                phien: data.data.Expect,
                xuc_xac_1: dices[0],
                xuc_xac_2: dices[1],
                xuc_xac_3: dices[2],
                tong: total,
                ket_qua: result,
                open_time: data.data.OpenTime
            };

            console.log(`✅ Cập nhật phiên ${latestResult.phien}: ${result} (${total})`);
        }
    } catch (err) {
        console.error("❌ Lỗi khi fetch API:", err.message);
    } finally {
        setTimeout(fetchLatest, FETCH_INTERVAL);
    }
}

// Gọi hàm fetch lần đầu
fetchLatest();

// Endpoint trả về 1 phiên mới nhất
app.get('/api/taixiu/ws', (req, res) => {
    if (!latestResult) {
        return res.status(503).json({
            error: "Chưa có dữ liệu phiên nào. Vui lòng chờ 3-5 giây."
        });
    }
    res.json(latestResult);
});

// Trang chủ
app.get('/', (req, res) => {
    res.send(`
        <h2>API Tài Xỉu đang chạy ✅</h2>
        <p>Xem phiên mới nhất tại: <a href="/api/taixiu/ws">/api/taixiu/ws</a></p>
    `);
});

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
