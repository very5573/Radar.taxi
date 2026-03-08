import mongoose from "mongoose";
import Conversation from "../models/Conversationmodel.js";
import Message from "../models/Messagemodel.js";

const sendMessageService = async ({ senderId, receiverId, text, conversationId }) => {
  if (!text) throw new Error("Text is required");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let conversation;
    let isNew = false;

    // ===============================
    // 1️⃣ Get or create conversation atomically
    // ===============================
    if (conversationId) {
      conversation = await Conversation.findById(conversationId).session(session);
      if (!conversation) throw new Error("Conversation not found");
    } else {
      if (!receiverId) throw new Error("receiverId required");

      // race condition avoid करने के लिए findOneAndUpdate upsert + session use
      conversation = await Conversation.findOneAndUpdate(
        { members: { $all: [senderId, receiverId] } },
        { $setOnInsert: { members: [senderId, receiverId], status: "pending", initiatedBy: senderId } },
        { new: true, upsert: true, session }
      );

      // अगर conversation newly created है, तो isNew true
      if (conversation.createdAt && conversation.createdAt.getTime() === conversation.updatedAt.getTime()) {
        isNew = true;
      }
    }

    // ===============================
    // 2️⃣ Security check
    // ===============================
    if (!conversation.members.some((id) => id.toString() === senderId.toString()))
      throw new Error("Not allowed");

    const actualReceiverId = conversation.members.find(
      (id) => id.toString() !== senderId.toString()
    );

    if (!actualReceiverId) throw new Error("Receiver not found");

    // ===============================
    // 3️⃣ Create message atomically
    // ===============================
    const [message] = await Message.create(
      [
        {
          conversationId: conversation._id,
          senderId,
          receiverId: actualReceiverId,
          text,
          read: false,
          delivered: false,
        },
      ],
      { session }
    );

    // ===============================
    // 4️⃣ Update lastMessage in conversation
    // ===============================
    await Conversation.findByIdAndUpdate(
      conversation._id,
      { lastMessage: message._id, lastMessageAt: message.createdAt },
      { session }
    );

    // ===============================
    // 5️⃣ Commit transaction
    // ===============================
    await session.commitTransaction();
    session.endSession();

    return {
      message,
      conversationId: conversation._id,
      receiverId: actualReceiverId,
      isNew,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("sendMessageService error:", err);
    throw err;
  }
};

export default sendMessageService;
