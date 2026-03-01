import { toast } from "react-toastify";
import API from "../../../utils/axiosInstance";
import socket from "../../../utils/socket";

// auth
import { clearUser } from "../../../redux/slices/authslice";

// conversation + realtime
import { resetConversationState } from "../../../redux/slices/conversationSlice";
import { resetRealtime } from "../../../redux/slices/realtimeSlice";

export const logoutUser = async (dispatch, router) => {
  try {
    // 🔥 Backend logout (invalidate refresh token / cookie)
    await API.post("/logout");

    // 🔥 CLEAR ALL REDUX STATE (VERY IMPORTANT)
    dispatch(clearUser());                 // auth
    dispatch(resetConversationState());    // inbox / messages
    dispatch(resetRealtime());             // online / typing / read

    // 🔥 DISCONNECT SOCKET (MOST IMPORTANT)
    if (socket.connected) {
      socket.disconnect();
      console.log("🔌 Socket disconnected on logout");
    }

    toast.success("✅ Logged out successfully");

    // 🔥 Redirect to login
    router.push("/auth/login");
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Logout failed, please try again."
    );
  }
};
