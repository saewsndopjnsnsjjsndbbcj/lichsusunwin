const Fastify = require("fastify");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const cors = require("@fastify/cors");

const fastify = Fastify({ logger: false });
const PORT = process.env.PORT || 10002;
const HISTORY_FILE = path.join(__dirname, "taixiu_history.json");
const FIREBASE_URL = "https://fir-data-8026b-default-rtdb.firebaseio.com/tokenfr.json";

let rikResults = [];
let rikCurrentSession = null;
let rikWS = null;
let reconnectTimeout = null;
let isAuthenticated = false;
let isConnectionHealthy = false;

// ==================== LẤY TOKEN TỪ FIREBASE ====================
async function getAuthData() {
  console.log("🔥 Đang lấy token từ Firebase...");
  try {
    const response = await fetch(FIREBASE_URL);
    const firebaseData = await response.json();
    const dataArray = firebaseData.data;

    const username1 = dataArray[2];
    const username2 = dataArray[3];
    const authObject = dataArray[4];
    const infoString = authObject.info;
    const signature = authObject.signature;
    const infoObject = JSON.parse(infoString);
    const wsToken = infoObject.wsToken;

    return { wsToken, username1, username2, info: infoString, signature };
  } catch (err) {
    console.error("❌ Lỗi khi lấy dữ liệu từ Firebase:", err.message);
    return null;
  }
}

// ==================== LOAD / SAVE LỊCH SỬ ====================
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      rikResults = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
      console.log(`📚 Loaded ${rikResults.length} lịch sử`);
    }
  } catch (err) {
    console.error("Lỗi load lịch sử:", err);
  }
}

function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(rikResults), "utf8");
  } catch (err) {
    console.error("Lỗi lưu lịch sử:", err);
  }
}

function getTX(d1, d2, d3) {
  return d1 + d2 + d3 >= 11 ? "Tài" : "Xỉu";
}

// ==================== KẾT NỐI WEBSOCKET ====================
async function connectWebSocket() {
  const authData = await getAuthData();
  if (!authData) return;

  if (rikWS) rikWS.terminate();

  const websocketUrl = `wss://websocket.gmwin.io/websocket?token=${authData.wsToken}`;
  rikWS = new WebSocket(websocketUrl);

  rikWS.on("open", () => {
    console.log("✅ Đã kết nối WebSocket");
    const authPayload = [
      1,
      "MiniGame",
      authData.username1,
      authData.username2,
      { info: authData.info, pid: 5, signature: authData.signature, subi: true },
    ];
    rikWS.send(JSON.stringify(authPayload));
  });

  rikWS.on("message", (data) => {
    try {
      const json = JSON.parse(data.toString());
      if (Array.isArray(json) && json[0] === 1 && json[1] === true) {
        isAuthenticated = true;
        console.log("✅ Xác thực thành công");
        return;
      }

      if (Array.isArray(json) && json[1]?.cmd === 1008 && json[1]?.sid) {
        rikCurrentSession = json[1].sid;
      }

      if (
        Array.isArray(json) &&
        (json[1]?.cmd === 1003 || json[1]?.cmd === 1004) &&
        json[1]?.d1 !== undefined
      ) {
        const res = json[1];
        if (!rikResults[0] || rikResults[0].sid !== rikCurrentSession) {
          const now = new Date().toLocaleString("vi-VN", { hour12: false });
          const payload = {
            Phien: rikCurrentSession,
            Xuc_xac_1: res.d1,
            Xuc_xac_2: res.d2,
            Xuc_xac_3: res.d3,
            Tong: res.d1 + res.d2 + res.d3,
            Ket_qua: getTX(res.d1, res.d2, res.d3),
            Thoi_gian: now,
          };
          rikResults.unshift(payload);
          rikResults = rikResults.slice(0, 1); // chỉ giữ 1 form duy nhất
          saveHistory();
          console.log("🎲 Phiên mới:", payload);
        }
      }
    } catch (e) {
      console.error("Parse error:", e.message);
    }
  });

  rikWS.on("close", () => {
    console.log("🔌 Mất kết nối. Tự động reconnect sau 5s...");
    reconnectTimeout = setTimeout(connectWebSocket, 5000);
  });

  rikWS.on("error", (err) => {
    console.error("WebSocket lỗi:", err.message);
    rikWS.terminate();
  });
}

// ==================== API ====================
fastify.register(cors);

fastify.get("/history", async (req, reply) => {
  if (!rikResults.length) return { message: "Chưa có phiên nào" };
  return rikResults[0]; // chỉ trả về 1 form
});

// ==================== START SERVER ====================
const start = async () => {
  try {
    loadHistory();
    connectWebSocket();
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Server chạy tại cổng ${PORT}`);
  } catch (err) {
    console.error("Server error:", err);
    process.exit(1);
  }
};

start();
