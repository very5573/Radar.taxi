import { Server } from "socket.io";
import Conversation from "../models/Conversationmodel.js";
import Message from "../models/Messagemodel.js";
import User from "../models/userModel.js"; // ✅ unified User model
import Ride from "../models/Ride.js";
import messageSocket from "../sockets/message.socket.js";

// Map to track online users & their multiple tabs
const onlineUsers = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  global.io = io; // ✅ global access for controllers

  // Middleware to set socket.userId from auth
  io.use((socket, next) => {
    const { userId } = socket.handshake.auth;
    if (!userId) return next(new Error("Invalid user"));
    socket.userId = userId;
    next();
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;

    messageSocket(io, socket); // existing message logic

    console.log("⚡ Socket connected:", socket.id, "userId:", userId);

    // Personal room
    socket.join(userId.toString());

    // ---------------- ONLINE USERS ----------------
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, { sockets: new Set() });

      io.emit("userOnline", { userId });

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: null,
      });
    }

    onlineUsers.get(userId).sockets.add(socket.id);

    socket.emit("onlineUsersSnapshot", {
      onlineUsers: Array.from(onlineUsers.keys()),
    });

    // ---------------- UNREAD MESSAGES ----------------
    socket.on("getUnreadMessages", async ({ conversationIds }) => {
      try {
        if (!Array.isArray(conversationIds) || !conversationIds.length) return;

        const messages = await Message.find({
          conversationId: { $in: conversationIds },
          receiverId: socket.userId,
          read: false,
        })
          .select("_id conversationId senderId receiverId text createdAt read")
          .lean();

        socket.emit("unreadMessages", { messages });
      } catch (err) {
        console.error("❌ getUnreadMessages error:", err);
      }
    });

    // ---------------- TYPING EVENT ----------------
    socket.on("typing", async ({ conversationId, senderId, isTyping }) => {
      try {
        if (!conversationId || !senderId) return;

        const conversation = await Conversation.findById(conversationId)
          .select("members")
          .lean();

        if (!conversation) return;

        const isMember = conversation.members.some(
          (id) => id.toString() === senderId.toString(),
        );
        if (!isMember) return;

        conversation.members.forEach((memberId) => {
          if (memberId.toString() !== senderId.toString()) {
            io.to(memberId.toString()).emit("typing", {
              conversationId: conversationId.toString(),
              senderId: senderId.toString(),
              isTyping: Boolean(isTyping),
            });
          }
        });
      } catch (err) {
        console.error("❌ typing event error:", err);
      }
    });

    socket.on(
      "driverLocationUpdate",
      async ({ rideId, latitude, longitude }) => {
        try {
          const driverId = socket.userId; // should come from socket auth
          console.log("🔑 Driver ID from socket auth:", driverId);
          console.log(
            "📍 Received coordinates:",
            latitude,
            longitude,
            "Ride ID:",
            rideId,
          );

          if (!driverId) {
            console.warn("⚠️ driverId undefined! Cannot update location.");
            return;
          }

          const driver = await User.findOne({ _id: driverId, role: "driver" });
          if (!driver) {
            console.warn("⚠️ Driver not found or role mismatch in DB");
            return;
          }

          // Update driver's current location
          driver.location = {
            type: "Point",
            coordinates: [longitude, latitude],
          };

          // Initialize locationHistory if undefined
          if (!driver.locationHistory) driver.locationHistory = [];

          // Add new location to history
          driver.locationHistory.push({
            latitude,
            longitude,
            timestamp: new Date(),
          });

          await driver.save();
          console.log("✅ Driver location updated in DB");

          // Broadcast to ride room if assigned
          if (rideId) {
            io.to(`ride_${rideId}`).emit("updateDriverLocation", {
              driverId,
              latitude,
              longitude,
            });
            console.log("📡 Broadcasted driver location to ride room:", rideId);
          }
        } catch (err) {
          console.error("❌ driverLocationUpdate error:", err);
        }
      },
    );
    // ---------------- JOIN RIDE ROOM ----------------
    socket.on("joinRideRoom", (rideId) => {
      socket.join(`ride_${rideId}`);
    });

    socket.on(
      "riderLocationUpdate",
      async ({ rideId, latitude, longitude }) => {
        try {
          const ride = await Ride.findById(rideId);
          if (!ride) return;

          ride.pickupLocation = {
            type: "Point",
            coordinates: [longitude, latitude],
          };

          if (!ride.locationHistory) ride.locationHistory = [];
          ride.locationHistory.push({
            longitude,
            latitude,
            timestamp: new Date(),
          });

          await ride.save();

          io.to(`ride_${rideId}`).emit("updateRiderLocation", {
            longitude,
            latitude,
          });
        } catch (err) {
          console.error("❌ riderLocationUpdate error:", err);
        }
      },
    );

    // ---------------- DISCONNECT ----------------
    socket.on("disconnect", async () => {
      if (!onlineUsers.has(userId)) return;

      const data = onlineUsers.get(userId);
      data.sockets.delete(socket.id);

      setTimeout(async () => {
        if (data.sockets.size === 0) {
          const lastSeen = new Date();
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen,
          });

          io.emit("userOffline", { userId, lastSeen });
        }
      }, 2000);
    });
  });

  return io;
};

export default initSocket;
