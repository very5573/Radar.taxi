import mongoose from "mongoose";
import User from "../models/userModel.js"; // सही path अपने project structure के अनुसार
import sendMessageService from "../services/message.service.js";

import Message from "../models/Messagemodel.js";
import Conversation from "../models/Conversationmodel.js";


// 🔹 Delete selected messages (for me) with transaction
export const deleteSelectedMessages = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { conversationId, messageIds } = req.body;

    if (!conversationId || !messageIds?.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid data" });
    }

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        conversationId,
      },
      {
        $addToSet: { deletedFor: userId }, // only this user
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ deleteForMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Delete messages for everyone with transaction
export const deleteMessagesForEveryone = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { messageIds } = req.body;
    const userId = req.user._id;

    if (!messageIds?.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "No messageIds provided" });
    }

    // 1️⃣ Fetch messages inside session
    const messages = await Message.find({ _id: { $in: messageIds } }).session(session);

    if (!messages.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No messages found" });
    }

    // 2️⃣ Allow ONLY messages sent by current user
    const allowedMessages = messages.filter(
      (msg) => msg.senderId.toString() === userId.toString()
    );

    if (!allowedMessages.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        message: "You can only delete your own messages for everyone",
      });
    }

    const allowedIds = allowedMessages.map((m) => m._id);

    // 3️⃣ Delete allowed messages
    await Message.deleteMany({ _id: { $in: allowedIds } }).session(session);

    await session.commitTransaction();
    session.endSession();

    // 4️⃣ Emit socket events AFTER commit
    const groupedByConversation = allowedMessages.reduce((acc, msg) => {
      const convId = msg.conversationId.toString();
      if (!acc[convId]) acc[convId] = [];
      acc[convId].push(msg._id.toString());
      return acc;
    }, {});

    for (const [conversationId, ids] of Object.entries(groupedByConversation)) {
      const conversation = await Conversation.findById(conversationId)
        .select("members")
        .lean();

      if (!conversation) continue;

      conversation.members.forEach((memberId) => {
        global.io.to(memberId.toString()).emit("messageDeleted", {
          conversationId,
          messageIds: ids,
        });
      });
    }

    res.status(200).json({
      success: true,
      deletedCount: allowedIds.length,
      message: "Messages deleted for everyone",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ deleteMessagesForEveryone:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // 🔐 Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId" });
    }

    // 🔎 Check conversation exists
    const conversation = await Conversation.findById(conversationId).populate(
      "members",
      "name avatar.url isOnline lastSeen",
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // 📩 Fetch messages
    // ❌ hide messages deleted FOR THIS USER
    // ❌ no read update here
    const messages = await Message.find({
      conversationId,
      deletedFor: { $ne: userId }, // 🗑 delete for me logic
    })
      .populate("senderId", "name avatar.url isOnline lastSeen")
      .populate("receiverId", "name avatar.url isOnline lastSeen")
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      conversation,
      messages,
    });
  } catch (err) {
    console.error("❌ getMessages ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};



export const sendMessage = async (req, res) => {
  console.log("📩 SEND MESSAGE API HIT");

  try {
    const { receiverId, text, conversationId } = req.body;

    // 🔴 Basic validation
    if (!receiverId || !text || !conversationId) {
      console.error("❌ Missing fields", {
        receiverId,
        text,
        conversationId,
      });

      return res.status(400).json({
        success: false,
        message: "receiverId, text, conversationId are required",
      });
    }

    console.log("🟡 Incoming data:", {
      senderId: req.user._id,
      receiverId,
      text,
      conversationId,
    });

    // 🔐 Call service (ONLY place where DB save should happen)
    const result = await sendMessageService({
      senderId: req.user._id, // server trusted
      receiverId,
      text,
      conversationId,
    });

    // 🔴 HARD PROOF CHECK
    if (!result?.message?._id) {
      console.error("❌ MESSAGE NOT SAVED IN DB");

      return res.status(500).json({
        success: false,
        message: "Message not saved in database",
      });
    }

    console.log("🟢 MESSAGE SAVED SUCCESSFULLY:", result.message._id);

    res.status(201).json({
      success: true,
      message: result.message, // ONLY DB saved message
    });
  } catch (err) {
    console.error("❌ SEND MESSAGE API ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};


export const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const conversations = await Conversation.find({
      members: userId,
      status: "accepted",
    })
      // 👤 Members (only what inbox needs)
      .populate({
        path: "members",
        select: "name avatar.url",
      })

      // 💬 Last message (for inbox preview)
      .populate({
        path: "lastMessage",
        select: "text createdAt senderId",
        populate: {
          path: "senderId",
          select: "name",
        },
      })

      // ⏰ Latest chat on top (WhatsApp behavior)
      .sort({ lastMessageAt: -1 });

    // 🔒 SAFETY FIX
    // If for any reason lastMessageAt is missing,
    // fallback to lastMessage.createdAt (prevents blank time)
    const formattedConversations = conversations.map((conv) => {
      const obj = conv.toObject();

      if (!obj.lastMessageAt && obj.lastMessage?.createdAt) {
        obj.lastMessageAt = obj.lastMessage.createdAt;
      }

      return obj;
    });

    res.status(200).json({
      success: true,
      conversations: formattedConversations,
    });
  } catch (err) {
    console.error("❌ getUserConversations error:", err);
    res.status(500).json({ error: err.message });
  }
};




export const createOrGetChat = async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;

  if (!receiverId) {
    return res.status(400).json({ message: "receiverId required" });
  }

  try {
    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    })
      .populate("members", "name avatar lastSeen")
      .populate("lastMessage");

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
        status: "pending",
        initiatedBy: senderId,
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("members", "name avatar lastSeen")
        .populate("lastMessage");
    }

    res.status(200).json({
      conversation,
    });
  } catch (err) {
    console.error("🔥 createOrGetChat ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getPendingRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await Conversation.find({
      members: userId,
      status: "pending",
      initiatedBy: { $ne: userId },
    }).populate("members", "name avatar");
    res.status(200).json({ requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const acceptConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // 1️⃣ Find conversation
    const conversation = await Conversation.findById(conversationId).populate(
      "members",
      "name avatar.url",
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // 2️⃣ Safety check (optional but recommended)
    const isMember = conversation.members.some(
      (m) => m._id.toString() === userId.toString(),
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 3️⃣ Accept conversation (NO read logic)
    conversation.status = "accepted";
    await conversation.save();

    

    // 6️⃣ 🔔 Emit socket event to all members
    conversation.members.forEach((member) => {
      global.io.to(member._id.toString()).emit("requestAccepted", {
        conversation,
      });
    });

    // 7️⃣ API response
    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (err) {
    console.error("❌ ACCEPT CONVERSATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

export const rejectConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // 1️⃣ Find conversation
    const conversation = await Conversation.findById(conversationId).populate(
      "members",
      "name avatar.url",
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // 2️⃣ Safety check (optional but recommended)
    const isMember = conversation.members.some(
      (m) => m._id.toString() === userId.toString(),
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 3️⃣ Reject conversation
    conversation.status = "rejected";
    await conversation.save();

    // 4️⃣ 🔔 Emit socket event to all members
    conversation.members.forEach((member) => {
      global.io.to(member._id.toString()).emit("requestRejected", {
        conversationId: conversation._id.toString(),
      });
    });

    // 5️⃣ API response
    res.status(200).json({
      success: true,
      message: "Conversation rejected",
      conversation,
    });
  } catch (err) {
    console.error("❌ REJECT CONVERSATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
