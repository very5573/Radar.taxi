"use client";

import { useState, useCallback } from "react";
import API from "../../../utils/axiosInstance";

export default function useMessageSelectDelete({
  conversationId = "",
  messages = [],
  setMessages = () => {},
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // ✅ toggle select mode
  const toggleSelect = useCallback((id) => {
    if (!id) return;
    setSelectMode(true);
    setSelectedMessages((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }, []);

  // ❌ exit select mode
  const resetSelect = useCallback(() => {
    setSelectMode(false);
    setSelectedMessages([]);
    setShowModal(false);
  }, []);

  // 🗑 delete for me
  const deleteForMe = useCallback(async () => {
    if (!selectedMessages.length || !conversationId) return;

    try {
      await API.delete("/messages/delete-selected", {
        data: {
          conversationId,
          messageIds: selectedMessages,
        },
      });

      // 🔹 Update local state directly
      setMessages((prev) =>
        prev.filter((msg) => !selectedMessages.includes(msg._id))
      );
    } catch (err) {
      console.error(
        "❌ Delete for me failed:",
        err?.response?.data || err?.message || err
      );
    }

    resetSelect();
  }, [selectedMessages, conversationId, setMessages, resetSelect]);

  // 🌍 delete for everyone
  const deleteForEveryone = useCallback(async () => {
    if (!selectedMessages.length || !conversationId) return;

    try {
      await API.delete("/messages/delete-for-everyone", {
        data: {
          conversationId,
          messageIds: selectedMessages,
        },
      });

      // 🔹 Update local state directly
      setMessages((prev) =>
        prev.filter((msg) => !selectedMessages.includes(msg._id))
      );
    } catch (err) {
      console.error(
        "❌ Delete for everyone failed:",
        err?.response?.data || err?.message || err
      );
    }

    resetSelect();
  }, [selectedMessages, conversationId, setMessages, resetSelect]);

  // ✅ select all messages
  const selectAllMessages = useCallback(() => {
    if (!Array.isArray(messages)) return;
    const allIds = messages.map((msg) => msg._id).filter(Boolean);
    setSelectMode(true);
    setSelectedMessages(allIds);
  }, [messages]);

  return {
    // state
    selectMode,
    selectedMessages,
    showModal,

    // setters
    setShowModal,

    // actions
    toggleSelect,
    resetSelect,
    deleteForMe,
    deleteForEveryone,
    selectAllMessages,
  };
}
