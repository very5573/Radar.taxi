// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/authslice";
import conversationReducer from "./slices/conversationSlice";
import chatActionReducer from "./slices/chatActionSlice";
import realtimeReducer from "./slices/realtimeSlice";
import { serializableFixMiddleware } from "./middleware/serializableFixMiddleware";

export const store = configureStore({
  reducer: {
    auth: userReducer,
    conversation: conversationReducer, // inbox, messages, selection
    chatAction: chatActionReducer,
    realtime: realtimeReducer, // instead of presence
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(serializableFixMiddleware),
});
