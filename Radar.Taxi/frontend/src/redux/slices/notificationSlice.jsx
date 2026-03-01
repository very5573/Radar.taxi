import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/axiosInstance";

// 🔹 FETCH NOTIFICATIONS
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await API.get(`/user/${userId}`);

      const notifications = res.data.notifications.map((n) => ({
        ...n,
        _id: String(n._id || n.id || ""),
        userId: String(n.userId || ""),
        orderId: n.orderId ? String(n.orderId) : "",
        productId: n.productId ? String(n.productId) : "",
        read: Boolean(n.read),
        createdAt: n.createdAt, // ✅ now keep as is, middleware will fix serialization
        updatedAt: n.updatedAt, // ✅ same here
      }));

      return notifications;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// 🔹 ADD LOCAL SOCKET NOTIFICATION
export const addLocalNotification = createAsyncThunk(
  "notifications/addLocal",
  async (notification) => ({
    ...notification,
    _id: String(notification._id || notification.id || ""),
    userId: String(notification.userId || ""),
    orderId: notification.orderId ? String(notification.orderId) : "",
    productId: notification.productId ? String(notification.productId) : "",
    read: Boolean(notification.read),
    createdAt: notification.createdAt, // ✅ keep as is
    updatedAt: notification.updatedAt, // ✅ keep as is
  })
);

// 🔹 DELETE SINGLE
export const deleteNotificationAPI = createAsyncThunk(
  "notifications/delete",
  async (id) => {
    await API.delete(`/delete/${id}`);
    return id;
  }
);

// 🔹 CLEAR ALL
export const clearAllNotificationsAPI = createAsyncThunk(
  "notifications/clear",
  async (userId) => {
    await API.delete(`/clear/${userId}`);
    return true;
  }
);

// 🔹 MARK AS READ
export const markReadAPI = createAsyncThunk(
  "notifications/markRead",
  async (id) => {
    await API.put(`/mark-read/${id}`);
    return id;
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    list: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 📡 FETCH
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;

        state.list = action.payload.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        state.unreadCount = state.list.filter((n) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 🔔 SOCKET ADD
      .addCase(addLocalNotification.fulfilled, (state, action) => {
        const n = action.payload;

        state.list = [n, ...state.list.filter((x) => x._id !== n._id)];
        if (!n.read) state.unreadCount += 1;
      })

      // ✅ MARK READ
      .addCase(markReadAPI.fulfilled, (state, action) => {
        const notif = state.list.find((n) => n._id === action.payload);
        if (notif && !notif.read) {
          notif.read = true;
          state.unreadCount -= 1;
        }
      })

      // 🗑️ DELETE SINGLE
      .addCase(deleteNotificationAPI.fulfilled, (state, action) => {
        const notif = state.list.find((n) => n._id === action.payload);
        if (notif && !notif.read) state.unreadCount -= 1;
        state.list = state.list.filter((n) => n._id !== action.payload);
      })

      // 🧹 CLEAR ALL
      .addCase(clearAllNotificationsAPI.fulfilled, (state) => {
        state.list = [];
        state.unreadCount = 0;
      });
  },
});

export default notificationSlice.reducer;
