"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import API from "../../../utils/axiosInstance";
import {
  setSelectedConversationId,
  addConversationIfNotExists,
} from "../../../redux/slices/conversationSlice";

const UserSearchInput = ({ onSelectChat }) => {
  const dispatch = useDispatch();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  const conversations = useSelector(
    (state) => state.conversation.conversations
  );

  // ================= SEARCH EFFECT =================
  useEffect(() => {
    if (!query.trim() || !currentUserId) {
      setUsers([]);
      return;
    }

    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await API.get(
          `/search?q=${encodeURIComponent(query)}&userId=${currentUserId}`
        );
        setUsers(res.data.users || []);
      } catch (err) {
        console.error("Search error:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutRef.current);
  }, [query, currentUserId]);

  // ================= HANDLE USER CLICK =================
  const handleUserClick = async (user) => {
    if (!user || !user._id) return;

    try {
      // Check if conversation already exists
      const existingConversation = conversations.find((c) =>
        c.members.some((m) => m._id === user._id)
      );

      if (existingConversation) {
        dispatch(setSelectedConversationId(existingConversation._id));
        setQuery("");
        setUsers([]);
        onSelectChat?.(); // ✅ Sidebar hide for mobile
        return;
      }

      // Create new conversation
      const res = await API.post("/chats", { receiverId: user._id });
      const conversation = res?.data?.conversation;

      if (!conversation) {
        console.error("❌ conversation object missing in API response");
        return;
      }

      dispatch(addConversationIfNotExists(conversation));
      dispatch(setSelectedConversationId(conversation._id));

      setQuery("");
      setUsers([]);
      onSelectChat?.(); // ✅ Sidebar hide for mobile
    } catch (err) {
      console.error("🔥 handleUserClick error:", err);
    }
  };

  // ================= RENDER =================
  return (
    <div className="relative w-full">
      {/* SEARCH INPUT */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users"
        className="
          w-full px-4 py-2 text-sm text-white
          bg-[#202c33] placeholder-gray-400
          rounded-full outline-none
          focus:ring-2 focus:ring-[#00a884]/40
        "
      />

      {/* SEARCH RESULTS */}
      {query && (
        <div
          className="
            absolute top-full left-0 right-0 mt-2
            bg-[#111b21] border border-black/30
            rounded-xl z-50 max-h-80 overflow-y-auto
            shadow-lg shadow-black/40
          "
        >
          {loading && (
            <div className="p-3 text-sm text-gray-400">Searching...</div>
          )}

          {!loading && users.length === 0 && (
            <div className="p-3 text-sm text-gray-400">No users found</div>
          )}

          {!loading &&
            users.map((user) => (
              <div
                key={user._id}
                onClick={() => handleUserClick(user)}
                className="
                  flex items-center gap-3 px-4 py-3
                  cursor-pointer transition
                  hover:bg-[#202c33]
                "
              >
                <img
                  src={user.avatar?.url || "/default-avatar.png"}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover"
                />

                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    @{user.username || "unknown"}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default UserSearchInput;
