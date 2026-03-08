
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import API from "../../../utils/axiosInstance";
import socket from "../../../utils/socket";

import {
  setSelectedConversationId,
  addConversationIfNotExists,
  resetConversationState,
  updateConversationLastMessage,
} from "../../../redux/slices/conversationSlice";

export default function InboxList({ onSelectChat }) {
  const dispatch = useDispatch();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);


  // ================= AUTH =================
  const currentUser = useSelector((state) => state.auth?.user);
  const userId = String(currentUser?._id || currentUser?.id);

  // ================= REDUX =================
  const selectedConversationId = useSelector(
    (state) => state.conversation.selectedConversationId
  );

  const conversations = useSelector(
    (state) => state.conversation.conversations
  );

  const typingUsers = useSelector(
    (state) => state.realtime.typingUsers
  );

  // ================= 🔥 FETCH INBOX =================
  useEffect(() => {
    if (!userId) return;

    dispatch(resetConversationState());

    const fetchInbox = async () => {
      try {
        setLoading(true);

        const { data } = await API.get(`/conversations/${userId}`);

        const sortedConversations = [...(data?.conversations || [])].sort(
          (a, b) => {
            const timeA = new Date(a.lastMessage?.createdAt || 0).getTime();
            const timeB = new Date(b.lastMessage?.createdAt || 0).getTime();
            return timeB - timeA;
          }
        );

        sortedConversations.forEach((c) => {
          dispatch(addConversationIfNotExists(c));

          if (c.lastMessage) {
            dispatch(
              updateConversationLastMessage({
                conversationId: c._id,
                lastMessage: c.lastMessage,
              })
            );
          }
        });

        const allMessages = [];
        sortedConversations.forEach((c) => {
          if (c.lastMessage) allMessages.push(c.lastMessage);
        });

        setMessages(allMessages);
      } catch (err) {
        console.error("❌ Failed to fetch conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInbox();
  }, [userId, dispatch]);

  // ================= 🔌 SOCKET JOIN / LEAVE =================
  useEffect(() => {
    if (!selectedConversationId) return;

    socket.emit("joinConversation", selectedConversationId);
    return () => socket.emit("leaveConversation", selectedConversationId);
  }, [selectedConversationId]);

  // ================= 📨 SOCKET: NEW MESSAGE =================
  useEffect(() => {
    const handleNewMessage = ({ message }) => {
      setMessages((prev) => {
        const others = prev.filter((m) => m._id !== message._id);
        return [...others, message];
      });

      dispatch(
        updateConversationLastMessage({
          conversationId: message.conversationId,
          lastMessage: message,
        })
      );

    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [dispatch]);

  // ================= 🔥 FINAL SORT (RENDER TIME) =================
  const sortedInboxConversations = useMemo(() => {
    return [...conversations]
      .filter((c) => c.status === "accepted")
      .sort((a, b) => {
        const timeA = new Date(a.lastMessage?.createdAt || 0).getTime();
        const timeB = new Date(b.lastMessage?.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [conversations]);

  if (!sortedInboxConversations.length) {
    return <div className="p-4 text-sm text-gray-400">No conversations yet</div>;
  }

  const formatTime = (date) =>
    date
      ? new Date(date).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {sortedInboxConversations.map((conv) => {
        const otherUser = conv.members?.find(
          (m) => String(m._id) !== userId
        );
        if (!otherUser) return null;

        const isActive = conv._id === selectedConversationId;
        const isTyping =
          typingUsers?.[conv._id]?.[String(otherUser._id)];

        const convMessages = messages.filter(
          (m) =>
            m.conversationId === conv._id ||
            (conv.lastMessage && m._id === conv.lastMessage._id)
        );

        const latestMsg = convMessages.length
          ? convMessages[convMessages.length - 1]
          : conv.lastMessage;

        return (
          <div key={conv._id} className="border-b border-black/20">
            <div
              onClick={() => {
                dispatch(setSelectedConversationId(conv._id));
                onSelectChat?.(conv);
              }}
              className={`flex items-center gap-3 px-3 sm:px-4 py-3 cursor-pointer transition ${
                isActive ? "bg-[#202c33]" : "hover:bg-[#1f2c34]"
              }`}
            >
              <img
                src={otherUser.avatar?.url || "/default-avatar.png"}
                alt={otherUser.name}
                className="w-11 h-11 rounded-full object-cover"
              />

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-white truncate">
                    {otherUser.name}
                  </p>
                  <span className="text-[11px] text-gray-400">
                    {formatTime(latestMsg?.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {isTyping ? (
                    <span className="text-[#00a884]">typing…</span>
                  ) : (
                    latestMsg?.text || "Start conversation"
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
