import sendMessageService from "../services/message.service.js";

const messageSocket = (io, socket) => {
  socket.on(
    "sendMessage",
    async ({ receiverId, text, conversationId }, callback) => {
      try {
        // 🔐 basic validation
        if (!receiverId || !text) {
          return callback?.({ error: "Invalid payload" });
        }

        // ✅ senderId ONLY from socket (secure)
        const result = await sendMessageService({
          senderId: socket.userId,
          receiverId,
          text,
          conversationId,
        });

        const {
          message,
          receiverId: actualReceiverId,
          conversationId: convId,
          isNew,
        } = result;

        const payload = {
          message,           // raw message (with conversationId inside)
          conversationId: convId,
          isNew,
        };

        // 👉 Receiver ko
        io.to(actualReceiverId.toString()).emit("newMessage", payload);

        // 👉 Sender ko (live update for self)
        io.to(socket.userId.toString()).emit("newMessage", payload);

        // 👉 optional ack
        callback?.(payload);
      } catch (err) {
        console.error("❌ sendMessage socket error:", err);
        callback?.({ error: err.message });
      }
    }
  );
};

export default messageSocket;



import express from "express";
import http from "http";
import { Server } from "socket.io";
import Ride from "../models/Ride.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Rider sends live location
  socket.on("riderLocationUpdate", async (data) => {
    const { rideId, latitude, longitude } = data;

    try {
      // Update DB (last location + history)
      const ride = await Ride.findById(rideId);
      if (!ride) return;

      // Last location
      ride.pickupLocation = { type: "Point", coordinates: [longitude, latitude] };

      // Optional: Save full location history
      if (!ride.locationHistory) ride.locationHistory = [];
      ride.locationHistory.push({ longitude, latitude, timestamp: new Date() });

      await ride.save();

      // Broadcast to driver
      io.to(`ride_${rideId}`).emit("updateRiderLocation", { longitude, latitude });
    } catch (err) {
      console.error(err);
    }
  });

  // Join driver to ride room
  socket.on("joinRideRoom", (rideId) => {
    socket.join(`ride_${rideId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => console.log("Server running on 3000"));

setRideId(data.rideId)

router.push(`/trip/${data.rideId}`)