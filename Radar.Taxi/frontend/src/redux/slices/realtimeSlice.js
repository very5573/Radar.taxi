import { createSlice } from "@reduxjs/toolkit";

/**
 * Realtime state is ONLY for UI
 * Source of truth = socket events
 */
const initialState = {
  onlineUsers: {}, // userId -> { online: boolean, lastSeen: string | null }
  typingUsers: {}, // conversationId -> { senderId: true }
  readByConversation: {}, // conversationId -> { [messageId]: [readerId] }
};

const realtimeSlice = createSlice({
  name: "realtime",
  initialState,
  reducers: {
    // ===============================
    // 🟢 PRESENCE (ONLINE / OFFLINE)
    // ===============================
    userOnline: (state, action) => {
      const userId = String(action.payload);
      const prev = state.onlineUsers[userId];
      state.onlineUsers[userId] = {
        online: true,
        lastSeen: prev?.lastSeen || null,
      };
    },

    userOffline: (state, action) => {
      const { userId, lastSeen } = action.payload;
      state.onlineUsers[String(userId)] = {
        online: false,
        lastSeen: lastSeen || null,
      };
    },

    userOnlineSnapshot: (state, action) => {
      const { onlineUsers } = action.payload;
      if (!Array.isArray(onlineUsers)) return;

      onlineUsers.forEach((user) => {
        const id = String(user.userId ?? user);
        const prev = state.onlineUsers[id];
        state.onlineUsers[id] = {
          online: true,
          lastSeen: user.lastSeen || prev?.lastSeen || null,
        };
      });
    },

    // ===============================
    // ✍️ TYPING INDICATOR
    // ===============================
    setTyping: (state, action) => {
      const { conversationId, senderId, isTyping } = action.payload;
      if (!conversationId || !senderId) return;

      if (!state.typingUsers[conversationId])
        state.typingUsers[conversationId] = {};

      if (isTyping) state.typingUsers[conversationId][senderId] = true;
      else delete state.typingUsers[conversationId][senderId];

      if (Object.keys(state.typingUsers[conversationId] || {}).length === 0) {
        delete state.typingUsers[conversationId];
      }
    },

    clearTyping: (state) => {
      state.typingUsers = {};
    },

    markMessagesReadUI: (state, action) => {
      const { conversationId, messageIds, readerId } = action.payload;
      if (!conversationId || !messageIds?.length) return;

      if (!state.readByConversation[conversationId])
        state.readByConversation[conversationId] = {};

      messageIds.forEach((id) => {
        if (!state.readByConversation[conversationId][id])
          state.readByConversation[conversationId][id] = [];
        if (!state.readByConversation[conversationId][id].includes(readerId)) {
          state.readByConversation[conversationId][id].push(readerId);
        }
      });
    },

    clearConversationRead: (state, action) => {
      delete state.readByConversation[action.payload];
    },

    // 🔥 Explicit reset (manual use if needed)
    resetRealtimeState: () => ({
      onlineUsers: {},
      typingUsers: {},
      readByConversation: {},
    }),

    // 🔥 GLOBAL RESET (logout / session end)
    resetRealtime: () => initialState,
  },
});

export const {
  userOnline,
  userOffline,
  userOnlineSnapshot,
  setTyping,
  clearTyping,
  markMessagesReadUI,
  clearConversationRead,
  resetRealtime,
  resetRealtimeState,
} = realtimeSlice.actions;

export default realtimeSlice.reducer;
