import express from "express";
import { sendMessage, getMessages, getUserConversations , getPendingRequests ,acceptConversation,
  rejectConversation,createOrGetChat, deleteMessagesForEveryone,  deleteSelectedMessages} from "../controller/MessageController.js";

import {
  isAuthenticatedUser,
  authorizeRoles,
} from "../middleware/auth.js";

const router = express.Router();

// Send a message
router.post("/message",isAuthenticatedUser, sendMessage);
router.post("/chats", isAuthenticatedUser, createOrGetChat);
router.get("/messages/:conversationId", isAuthenticatedUser, getMessages);
// routes/chat.js या users.js
router.get("/users/requests/:userId", isAuthenticatedUser, getPendingRequests);



// Get all messages of a conversation

router.put("/accept/:conversationId", isAuthenticatedUser, acceptConversation);

// ✅ Reject a chat request
router.put("/reject/:conversationId", isAuthenticatedUser, rejectConversation);
// Get all conversations of a user
router.get("/conversations/:userId", getUserConversations);

router.delete(
  "/messages/delete-for-everyone",
  isAuthenticatedUser,
  deleteMessagesForEveryone
);

router.delete(
  "/messages/delete-selected",
  isAuthenticatedUser,
  deleteSelectedMessages
);
export default router;