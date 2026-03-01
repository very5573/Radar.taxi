"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// ✅ Chat action slice
import {
  acceptRequest,
  rejectRequest,
  fetchMessageRequests,
} from "../../../redux/slices/chatActionSlice";

// ✅ Conversation slice
import {
  acceptConversationSuccess,
  rejectConversationSuccess,
} from "../../../redux/slices/conversationSlice";

// ✅ MUI Icons
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

export default function RequestList() {
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth?.user);
  const userId = currentUser?._id || currentUser?.id;

  // 🔹 Requests from chatActionSlice
  const requests = useSelector(
    (state) => state.chatAction?.requests ?? []
  );
  const loading = useSelector(
    (state) => state.chatAction?.loadingRequests ?? false
  );

  // 🔹 Fetch pending requests
  useEffect(() => {
    if (!userId) return;
    dispatch(fetchMessageRequests(userId));
  }, [userId, dispatch]);

  if (loading) {
    return (
      <p className="p-4 text-sm text-gray-400">Loading requests...</p>
    );
  }

  if (!requests.length) {
    return (
      <p className="p-4 text-sm text-gray-500">No message requests</p>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {requests.map((req) => {
        const otherUser = req.members?.find((m) => m._id !== userId);
        if (!otherUser) return null;

        return (
          <div
            key={req._id}
            className="
              flex items-center justify-between
              p-3 rounded-lg
              bg-[#202c33]
              border border-black/30
            "
          >
            {/* USER INFO */}
            <div className="flex items-center gap-3">
              <img
                src={otherUser.avatar?.url || "/default-avatar.png"}
                alt={otherUser.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {otherUser.name}
                </p>
                <p className="text-xs text-gray-400">
                  Sent you a message request
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2">
              {/* ACCEPT */}
              <button
                onClick={() => {
                  // ✅ chatActionSlice
                  dispatch(acceptRequest(req._id));
                  // ✅ conversationSlice
                  dispatch(acceptConversationSuccess(req));
                }}
                className="
                  flex items-center justify-center
                  w-9 h-9 rounded-full
                  bg-[#00a884] text-white
                  hover:bg-[#029e7b]
                  transition
                "
                title="Accept"
              >
                <CheckIcon fontSize="small" />
              </button>

              {/* REJECT */}
              <button
                onClick={() => {
                  // ✅ chatActionSlice
                  dispatch(rejectRequest(req._id));
                  // ✅ conversationSlice
                  dispatch(rejectConversationSuccess(req._id));
                }}
                className="
                  flex items-center justify-center
                  w-9 h-9 rounded-full
                  bg-[#3b3b3b] text-gray-200
                  hover:bg-[#4a4a4a]
                  transition
                "
                title="Reject"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}