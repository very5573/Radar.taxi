import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/axiosInstance";
import { addConversationIfNotExists, setConversationMessages } from "./conversationSlice";

// ------------------- ASYNC THUNKS -------------------

// Fetch pending message requests
export const fetchMessageRequests = createAsyncThunk(
  "chatAction/fetchMessageRequests",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/users/requests/${userId}`);
      return data.requests || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Accept a message request
export const acceptRequest = createAsyncThunk(
  "chatAction/acceptRequest",
  async (conversationId, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await API.put(`/accept/${conversationId}`);
      const convo = data.conversation;

      // ✅ Automatically update conversation slice
      if (convo?._id) {
        dispatch(addConversationIfNotExists(convo));
        
      }

      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Reject a message request
export const rejectRequest = createAsyncThunk(
  "chatAction/rejectRequest",
  async (conversationId, { rejectWithValue }) => {
    try {
      await API.put(`/reject/${conversationId}`);
      return conversationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ------------------- SLICE -------------------

const chatActionSlice = createSlice({
  name: "chatAction",
  initialState: {
    requests: [],
    loadingRequests: false,
    acceptingRequest: false,
    rejectingRequest: false,
    error: null,
  },
  reducers: {
    clearChatActionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch requests
      .addCase(fetchMessageRequests.pending, (state) => {
        state.loadingRequests = true;
        state.error = null;
      })
      .addCase(fetchMessageRequests.fulfilled, (state, action) => {
        state.loadingRequests = false;
        state.requests = action.payload;
      })
      .addCase(fetchMessageRequests.rejected, (state, action) => {
        state.loadingRequests = false;
        state.error = action.payload;
      })

      // Accept request
      .addCase(acceptRequest.pending, (state) => {
        state.acceptingRequest = true;
        state.error = null;
      })
      .addCase(acceptRequest.fulfilled, (state, action) => {
        state.acceptingRequest = false;
        const convoId = action.payload?.conversation?._id;
        if (convoId) {
          state.requests = state.requests.filter(r => r._id !== convoId);
        }
      })
      .addCase(acceptRequest.rejected, (state, action) => {
        state.acceptingRequest = false;
        state.error = action.payload;
      })

      // Reject request
      .addCase(rejectRequest.pending, (state) => {
        state.rejectingRequest = true;
        state.error = null;
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        state.rejectingRequest = false;
        state.requests = state.requests.filter(r => r._id !== action.payload);
      })
      .addCase(rejectRequest.rejected, (state, action) => {
        state.rejectingRequest = false;
        state.error = action.payload;
      });
  },
});

export const { clearChatActionError } = chatActionSlice.actions;
export default chatActionSlice.reducer;
