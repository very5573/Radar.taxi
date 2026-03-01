import app from "./app.js";
import http from "http";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import connectDatabase from "./config/database.js";
import initSocket from "./sockets/connection.js"; // ✅ Socket.IO

/* =========================
   ENV CONFIG
========================= */
// अब backend root .env से read होगा
dotenv.config();

/* =========================
   UNCAUGHT EXCEPTION
========================= */
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});

/* =========================
   START SERVER
========================= */
const startServer = async () => {
  try {
    console.log("🔹 Starting server...");

    // 1️⃣ Connect Database
    await connectDatabase();
    console.log("✅ Database connected");

    // 2️⃣ Cloudinary Config
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("☁️ Cloudinary configured");

    // 3️⃣ Create HTTP Server
    const server = http.createServer(app);

    // 4️⃣ Initialize Socket.IO
    const io = initSocket(server);
    global.io = io; // ✅ Controllers me access ke liye

    // 5️⃣ Start Listening
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`🌐 Frontend allowed: ${process.env.FRONTEND_URL}`);
    });

    /* =========================
       UNHANDLED PROMISE
    ========================= */
    process.on("unhandledRejection", (err) => {
      console.error("❌ Unhandled Rejection:", err.message);
      console.error(err.stack);
      server.close(() => process.exit(1));
    });

  } catch (err) {
    console.error("❌ Startup Error:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

startServer();

export default startServer;
