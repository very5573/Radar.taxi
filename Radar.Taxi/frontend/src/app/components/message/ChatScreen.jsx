"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChatInput from "./ChatInput";
import { getMessages } from "./getMessagesLogic";
import socket from "../../../utils/socket";

import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import MessageSelectDelete from "./MessageSelectDelete";

import {
  formatLastSeen,
  getDateLabel,
  formatMessageTime,
} from "./chatDateUtils";

export default function ChatScreenn({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otherUserState, setOtherUserState] = useState(null);

  const currentUser = useSelector((state) => state.auth?.user);
  const userId = String(currentUser?._id || currentUser?.id);

  const conversationId = useSelector(
    (state) => state.conversation.selectedConversationId,
  );

  const conversations = useSelector(
    (state) => state.conversation.conversations,
  );

  const getSenderId = (senderId) =>
    typeof senderId === "object" ? senderId._id : senderId;

  const onlineUsers = useSelector((state) => state.realtime.onlineUsers);
  const typingUsers = useSelector((state) => state.realtime.typingUsers);

  const otherUser =
    conversations
      .find((c) => c._id === conversationId)
      ?.members.find((m) => String(m._id) !== userId) || null;

  const otherUserPresence = onlineUsers?.[otherUser?._id];

  const isOtherUserOnline =
    otherUserPresence?.online ?? otherUserState?.isOnline ?? false;
  const lastSeen = otherUserPresence?.lastSeen ?? otherUserState?.lastSeen;
  const isOtherUserTyping =
    typingUsers?.[conversationId]?.[otherUser?._id] || false;

  const fetchedOnceRef = useRef({});
  const messagesContainerRef = useRef(null); // Scroll container
  const bottomRef = useRef(null); // Scroll target

  useEffect(() => {
    if (conversationId) {
      socket.emit("joinConversation", conversationId);
    }

    return () => {
      if (conversationId) {
        socket.emit("leaveConversation", conversationId);
      }
    };
  }, [conversationId]);

  // ===================== MESSAGE DELIVERED (SINGLE / DOUBLE GRAY TICK) =====================
  useEffect(() => {
    if (!conversationId || !userId) return;

    const handleDelivered = ({ conversationId: convId, messageIds }) => {
      // 1️⃣ Sirf current open conversation
      if (convId !== conversationId) return;

      if (!Array.isArray(messageIds) || !messageIds.length) return;

      // 2️⃣ Sirf SENDER ke messages pe delivered lagana hai
      setMessages((prev) =>
        prev.map((m) => {
          const isMyMessage = String(m.senderId) === String(userId);
          const isTarget = messageIds.includes(m._id);

          // already delivered hai to re-render avoid
          if (isMyMessage && isTarget && !m.delivered) {
            return { ...m, delivered: true };
          }

          return m;
        }),
      );
    };

    socket.on("messageDelivered", handleDelivered);

    return () => {
      socket.off("messageDelivered", handleDelivered);
    };
  }, [conversationId, userId]);

  useEffect(() => {
    if (!conversationId) return;

    const handleMessageRead = ({
      conversationId: convId,
      messageIds,
      readerId,
    }) => {
      // 1️⃣ Sirf current conversation
      if (convId !== conversationId) return;

      // 2️⃣ Agar main hi reader hoon → ignore
      if (String(readerId) === String(userId)) return;

      // 3️⃣ Sirf mere bheje hue messages pe blue tick
      setMessages((prev) =>
        prev.map((m) => {
          const isMyMessage = String(m.senderId) === String(userId);
          const isTarget = messageIds.includes(m._id);

          if (isMyMessage && isTarget && !m.read) {
            return { ...m, read: true };
          }
          return m;
        }),
      );
    };

    socket.on("messageRead", handleMessageRead);

    return () => {
      socket.off("messageRead", handleMessageRead);
    };
  }, [conversationId, userId]);

  // -------------------- NEW MESSAGE LISTENER --------------------
  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = ({ message, conversationId: convId }) => {
      console.log("📨 New message received:", message);

      // ❌ Agar current conversation nahi hai to ignore
      if (convId !== conversationId) {
        console.log(
          "⏭ Skipping newMessage: conversationId mismatch",
          convId,
          conversationId,
        );
        return;
      }

      // 1️⃣ Message local state me add karo
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === message._id);
        if (exists) return prev; // 🛑 duplicate protection
        return [...prev, message];
      });

      // 2️⃣ ✅ DELIVERED (receiver device tak pahucha)
      if (message.receiverId === userId) {
        socket.emit("messageDelivered", {
          conversationId: convId,
          messageIds: [message._id],
        });
      }

      // 3️⃣ ✅ READ (receiver ne chat open kar rakhi hai)
      if (message.receiverId === userId && !message.read) {
        socket.emit("markMessageRead", {
          conversationId: convId,
          messageIds: [message._id],
        });

        // 🔥 Optimistic UI (receiver side)
        setMessages((prev) =>
          prev.map((m) => (m._id === message._id ? { ...m, read: true } : m)),
        );
      }

      // 4️⃣ Scroll to bottom
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [conversationId, userId]);

  const handleUnreadMessages = ({ messages }) => {
    if (!Array.isArray(messages) || messages.length === 0) {
      setLoading(false);
      return;
    }

    // 1️⃣ Sirf mujhe aaye hue messages
    const incoming = messages.filter(
      (m) => String(m.receiverId?._id || m.receiverId) === String(userId),
    );

    if (incoming.length === 0) {
      setLoading(false);
      return;
    }

    const messageIds = incoming.map((m) => m._id);

    // 2️⃣ Local state update (single setState)
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m._id));

      return [
        ...prev,
        ...incoming
          .filter((m) => !existingIds.has(m._id))
          .map((m) => ({
            ...m,
            delivered: true, // device tak aa chuka
            read: true, // chat open hai isliye read
          })),
      ];
    });

    // 3️⃣ Sender ko notify → delivered
    socket.emit("messageDelivered", {
      conversationId,
      messageIds,
    });

    // 4️⃣ Sender ko notify → read
    socket.emit("markMessageRead", {
      conversationId,
      messageIds,
    });

    setLoading(false);
  };

  useEffect(() => {
    if (!conversationId) return;

    setLoading(true);

    socket.emit("getUnreadMessages", {
      conversationIds: [conversationId],
    });

    socket.on("unreadMessages", handleUnreadMessages);

    return () => {
      socket.off("unreadMessages", handleUnreadMessages);
    };
  }, [conversationId, userId]);

  // ================= SCROLL LOGIC =================
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Track if user is at bottom (optional)
  const isUserAtBottomRef = useRef(true);
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const threshold = 50;
      isUserAtBottomRef.current =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        threshold;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔹 Scroll to bottom on initial load & new messages
  useEffect(() => {
    if (!conversationId || !messages.length) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    let rafId;

    const scrollWhenReady = () => {
      // Scroll bottom
      scrollToBottom();

      // Check if DOM height is set correctly
      if (container.scrollHeight <= container.clientHeight + 20) {
        // If height not enough yet, try next frame
        rafId = requestAnimationFrame(scrollWhenReady);
      }
    };

    rafId = requestAnimationFrame(scrollWhenReady);

    return () => cancelAnimationFrame(rafId);
  }, [messages, conversationId, scrollToBottom]);

  useEffect(() => {
    if (!conversationId) return;

    setLoading(true);

    getMessages({ conversationId }).then((data) => {
      if (!data) return;

      setMessages(data.messages || []);

      // ✅ set the other user for lastSeen / online status
      const other = data.conversation.members.find(
        (m) => String(m._id) !== userId,
      );
      if (other) setOtherUserState(other);

      setLoading(false);
    });
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const handleMessageDeleted = ({ conversationId: convId, messageIds }) => {
      console.log("🔥 messageDeleted event:", { convId, messageIds });

      if (convId !== conversationId) return;

      setMessages((prev) =>
        prev.filter((msg) => !messageIds.map(String).includes(String(msg._id))),
      );
    };

    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [conversationId]);

  // ================= EMPTY =================
  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
        <ChatBubbleOutlineIcon className="text-white text-5xl animate-bounce" />
        <p className="text-lg font-medium">Select a chat to start messaging</p>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div
      className="flex flex-col h-full w-full"
      style={{
        background: "linear-gradient(160deg, #0d1117, #101921, #1b2c38)",
      }}
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#202c33]/80 backdrop-blur-xl border-b border-black/20 shadow-md">
        {/* 🔙 Mobile Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden text-gray-300 hover:text-white transition"
          >
            <ArrowBackIcon />
          </button>
        )}

        {/* AVATAR */}
        <div className="relative">
          <img
            src={otherUser?.avatar?.url || "/default-avatar.png"}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-gradient-to-tr from-[#53bdeb] to-[#0af7a1]"
          />
          {isOtherUserOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse"></span>
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <p className="text-white font-semibold text-lg truncate">
            {otherUser?.name || "User"}
          </p>
          <p className="text-xs text-gray-300 flex flex-wrap gap-1">
            {isOtherUserTyping ? (
              <span className="animate-pulse text-[#53bdeb] font-medium">
                typing…
              </span>
            ) : isOtherUserOnline ? (
              <span className="text-[#00a884]">online</span>
            ) : lastSeen ? (
              <span>last seen {formatLastSeen(lastSeen)}</span>
            ) : (
              <span>last seen not available</span>
            )}
          </p>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3 scrollbar-thin"
      >
        {loading && (
          <p className="text-center text-gray-400 text-sm">Loading...</p>
        )}
        <MessageSelectDelete
          conversationId={conversationId}
          messages={messages}
          setMessages={setMessages}
          renderMessages={(msg, { selectMode }) => {
            if (!msg) return null;
            const isMe = String(getSenderId(msg.senderId)) === userId;
            const isDelivered = isMe && msg.delivered;
            const isRead = isMe && msg.read;

            const index = messages.findIndex((m) => m._id === msg._id);

            const currentDate = new Date(msg.createdAt).toDateString();
            const prevDate =
              index > 0
                ? new Date(messages[index - 1].createdAt).toDateString()
                : null;
            const showDate = index === 0 || currentDate !== prevDate;

            return (
              <div key={msg._id}>
                {/* DATE SEPARATOR */}
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="px-5 py-1 text-xs rounded-full bg-[#1f2c33]/70 backdrop-blur-lg text-gray-200 shadow-lg">
                      {getDateLabel(msg.createdAt)}
                    </span>
                  </div>
                )}

                {/* MESSAGE BUBBLE */}
                <div
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 text-sm leading-relaxed break-words shadow-md transition duration-200 transform hover:scale-[1.02]
                max-w-[60%] sm:max-w-[60%] md:max-w-[50%] 
                ${
                  isMe
                    ? "bg-gradient-to-br from-[#005c4b] to-[#0a6e5a] text-white rounded-2xl rounded-br-md"
                    : "bg-[#202c33]/70 backdrop-blur-md text-white rounded-2xl rounded-bl-md"
                }`}
                    style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}
                  >
                    <p>{msg.text}</p>

                    {/* Timestamp + Read Receipts */}
                    <div className="flex items-center justify-end gap-2 mt-1 text-[10px] text-gray-300 select-none">
                      {formatMessageTime(msg.createdAt)}

                      {isMe &&
                        (isRead ? (
                          // ✅ READ → double blue tick
                          <DoneAllIcon className="!text-[#53bdeb] !text-[14px]" />
                        ) : isDelivered ? (
                          // ✅ DELIVERED → double gray tick
                          <DoneAllIcon className="!text-gray-400 !text-[14px]" />
                        ) : (
                          // ✅ SENT ONLY → single gray tick
                          <DoneIcon className="!text-gray-400 !text-[14px]" />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        />

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <ChatInput conversationId={conversationId} />
    </div>
  );
}
