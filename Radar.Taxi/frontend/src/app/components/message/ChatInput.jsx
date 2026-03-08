"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import SendIcon from "@mui/icons-material/Send";
import { handleChatInputLogic } from "./chatSocketLogic";

export default function ChatInput() {
  const dispatch = useDispatch();
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef(null);

  const currentUser = useSelector((state) => state.auth?.user);
  const userId = String(currentUser?._id || currentUser?.id);

  const selectedConversationId = useSelector(
    (state) => state.conversation.selectedConversationId
  );

  const otherUser = useSelector((state) => {
    const conversation = state.conversation.conversations.find(
      (c) => c._id === selectedConversationId
    );
    if (!conversation) return null;
    return conversation.members.find((m) => String(m._id) !== userId);
  });

  // ================= HANDLE TYPING & SEND =================
  const handleTyping = (value) =>
    handleChatInputLogic.handleTyping({
      value,
      text,
      setText,
      dispatch,
      userId,
      selectedConversationId,
      otherUser,
      typingTimeoutRef,
    });

  const handleSend = () =>
    handleChatInputLogic.handleSend({
      text,
      setText,
      dispatch,
      userId,
      selectedConversationId,
      otherUser,
    });

  // Cleanup typing on unmount
  useEffect(() => {
    return () =>
      handleChatInputLogic.cleanup({
        dispatch,
        userId,
        selectedConversationId,
        otherUser,
      });
  }, [dispatch, selectedConversationId, otherUser, userId]);

  // ================= UI =================
  return (
    <div className="relative flex flex-col sm:flex-row items-center gap-2 px-3 py-3 bg-[#202c33]/90 backdrop-blur-md border-t border-black/30">

      {/* MULTILINE TEXTAREA */}
      <textarea
        value={text}
        onChange={(e) => handleTyping(e.target.value)}
        placeholder="Type a message"
        rows={1}
        className="
          flex-1 w-full
          sm:w-full md:w-[70%] lg:w-[75%] xl:w-[80%]
          px-5 py-3 text-sm text-white
          bg-[#111b21]/70 backdrop-blur-md placeholder-[#53bdeb]/60
          rounded-full outline-none
          focus:ring-2 focus:ring-[#53bdeb]/50
          transition
          resize-none overflow-y-auto
        "
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      {/* SEND BUTTON */}
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="
          flex items-center justify-center
          w-12 h-12 sm:w-11 sm:h-11
          rounded-full
          bg-gradient-to-tr from-[#00a884] to-[#0af7a1]
          text-white shadow-lg
          hover:scale-110 transition-transform duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
        "
      >
        <SendIcon fontSize="small" />
      </button>

      {/* TYPING INDICATOR */}
      {otherUser && otherUser?.isTyping && (
        <div className="
          absolute left-5 bottom-[4.5rem]  /* thoda upar le gaya input se */
          text-xs text-[#53bdeb] animate-pulse
          max-w-[90%] sm:max-w-[50%] truncate
          bg-[#202c33]/70 px-2 py-1 rounded-full
          backdrop-blur-md
        ">
          typing…
        </div>
      )}
    </div>
  );
}
