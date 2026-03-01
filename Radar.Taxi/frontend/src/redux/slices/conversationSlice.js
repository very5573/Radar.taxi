import { createSlice } from "@reduxjs/toolkit";

// ================= STATE =================
const initialState = {
  conversations: [],
  pendingRequests: [],
  selectedConversationId: null,
};

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
   

    // ================= CONVERSATIONS =================
    addConversationIfNotExists: (state, action) => {
      const convo = action.payload;
      if (!convo?._id) return;

      // sirf accepted conversations
      if (convo.status !== "accepted") return;

      // duplicate check
      const exists = state.conversations.find((c) => c._id === convo._id);
      if (exists) return;

      // directly add (no spread, no force, no cleanup)
      state.conversations.unshift(convo);
    },

    
updateConversationLastMessage: (state, action) => {
  const { conversationId, lastMessage } = action.payload;

  const index = state.conversations.findIndex(
    (c) => c._id === conversationId
  );
  if (index === -1) return;

  state.conversations[index].lastMessage = lastMessage;

  // 🔥 move to top
  const [convo] = state.conversations.splice(index, 1);
  state.conversations.unshift(convo);
},

    // ================= MESSAGES =================

    setSelectedConversationId: (state, action) => {
      state.selectedConversationId = action.payload;
      console.log("📌 Selected conversation:", action.payload);
    },

    acceptConversationSuccess: (state, action) => {
      const convo = action.payload;
      if (!convo?._id) return;

      // pending se remove
      state.pendingRequests = state.pendingRequests.filter(
        (r) => r._id !== convo._id,
      );

      // conversations me add (agar pehle se nahi hai)
      const exists = state.conversations.find((c) => c._id === convo._id);
      if (exists) return;

      convo.status = "accepted";
      state.conversations.unshift(convo);
    },


    rejectConversationSuccess: (state, action) => {
      const conversationId = action.payload;
      if (!conversationId) return;

      state.pendingRequests = state.pendingRequests.filter(
        (r) => r._id !== conversationId,
      );
    },

    // ================= 🔥 RESET (LOGOUT FIX) =================
    resetConversationState: () => initialState,
  },
});

export const {
  addConversationIfNotExists,
  setSelectedConversationId,
  acceptConversationSuccess,
    updateConversationLastMessage, // ✅ ADD THIS

  rejectConversationSuccess,
  resetConversationState,
} = conversationSlice.actions;

export default conversationSlice.reducer;
