"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/axiosInstance";

// 🔥 Fetch current user — runs on reload & after login
export const fetchUser = createAsyncThunk(
  "auth/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/me");
      return data?.user || null;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Not authenticated"
      );
    }
  }
);

const initialState = {
  user: undefined,        
  isAuthenticated: false,
  authChecked: false,     // 🔥 AUTH STATUS CONFIRMED OR NOT
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // 🔥 ONLY for logout
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.authChecked = true;   
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔄 when /me starts
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;          // user OR null
        state.isAuthenticated = !!action.payload;
        state.authChecked = true;             // 🔥 CHECK DONE
        state.loading = false;
      })

      .addCase(fetchUser.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.authChecked = true;             // 🔥 CHECK DONE
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUser } = authSlice.actions;
export default authSlice.reducer;
