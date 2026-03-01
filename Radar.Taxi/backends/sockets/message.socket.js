import sendMessageService from "../services/message.service.js";
import Message from "../models/Messagemodel.js";
import Conversation from "../models/Conversationmodel.js";

const messageSocket = (io, socket) => {

  /* ======================================================
     SEND MESSAGE (WhatsApp style)
     ====================================================== */
  socket.on(
    "sendMessage",
    async ({ receiverId, text, conversationId }, callback) => {
      try {
        if (!receiverId || !text || !conversationId) {
          return callback?.({ error: "Invalid payload" });
        }

        // 1️⃣ Save message in DB (source of truth)
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
          message,
          conversationId: convId,
          isNew,
        };

        // 2️⃣ Deliver message to RECEIVER (ALL devices)
        io.to(actualReceiverId.toString()).emit("newMessage", payload);

        // 3️⃣ Deliver message to SENDER (self sync, all devices)
        io.to(socket.userId.toString()).emit("newMessage", payload);

        callback?.(payload);
      } catch (err) {
        console.error("❌ sendMessage socket error:", err);
        callback?.({ error: err.message });
      }
    }
  );

  /* ======================================================
     JOIN / LEAVE CONVERSATION (UI helper only)
     ====================================================== */
  socket.on("joinConversation", (conversationId) => {
    if (!conversationId) return;
    socket.join(conversationId.toString());
  });

  socket.on("leaveConversation", (conversationId) => {
    if (!conversationId) return;
    socket.leave(conversationId.toString());
  });

  /* ======================================================
     MESSAGE DELIVERED (✓ single tick)
     WhatsApp rule: notify SENDER USER (not conversation)
     ====================================================== */
  socket.on("messageDelivered", async ({ conversationId, messageIds }) => {
    if (!Array.isArray(messageIds) || !messageIds.length) return;

    try {
      // 1️⃣ Mark delivered in DB
      const result = await Message.updateMany(
        {
          _id: { $in: messageIds },
          receiverId: socket.userId,
          delivered: false,
        },
        { $set: { delivered: true } }
      );

      if (!result.modifiedCount) return;

      // 2️⃣ Find sender (single query, safe)
      const firstMsg = await Message.findById(messageIds[0])
        .select("senderId conversationId")
        .lean();

      if (!firstMsg) return;

      // 3️⃣ Notify SENDER (ALL devices)
      io.to(firstMsg.senderId.toString()).emit("messageDelivered", {
        conversationId: firstMsg.conversationId.toString(),
        messageIds,
        receiverId: socket.userId,
      });
    } catch (err) {
      console.error("❌ messageDelivered error:", err);
    }
  });

  /* ======================================================
     MESSAGE READ (✓✓ double tick)
     WhatsApp rule: notify SENDER USER (not conversation)
     ====================================================== */
  socket.on("markMessageRead", async ({ conversationId, messageIds }) => {
    if (!Array.isArray(messageIds) || !messageIds.length) return;

    try {
      // 1️⃣ Mark read in DB
      const result = await Message.updateMany(
        {
          _id: { $in: messageIds },
          receiverId: socket.userId,
          read: false,
        },
        { $set: { read: true } }
      );

      if (!result.modifiedCount) return;

      // 2️⃣ Find sender
      const firstMsg = await Message.findById(messageIds[0])
        .select("senderId conversationId")
        .lean();

      if (!firstMsg) return;

      // 3️⃣ Notify SENDER (ALL devices)
      io.to(firstMsg.senderId.toString()).emit("messageRead", {
        conversationId: firstMsg.conversationId.toString(),
        messageIds,
        readerId: socket.userId,
      });

      // 4️⃣ Optional confirmation to READER (self devices)
      io.to(socket.userId.toString()).emit("messageReadConfirmed", {
        conversationId: firstMsg.conversationId.toString(),
        messageIds,
      });
    } catch (err) {
      console.error("❌ markMessageRead error:", err);
    }
  });
};

export default messageSocket;

