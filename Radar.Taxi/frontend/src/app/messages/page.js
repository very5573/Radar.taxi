"use client"; // ✅ Add this at the very top

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

// Components
import UserSearchInput from "../components/message/Searchbar";
import InboxList from "../components/message/InboxList";
import RequestList from "../components/message/RequestList";
import ChatScreen from "../components/message/ChatScreen";

// Icons
import CloseIcon from "@mui/icons-material/Close";

const InstagramDMModal = () => {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState("inbox");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // ================= RESPONSIVE =================
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ❌ Close whole modal
  const handleClose = () => {
    router.push("/");
  };

  // 📱 Mobile: open chat → hide sidebar
  const handleSelectChat = () => {
    if (isMobile) setShowSidebar(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b141a]">
      <div className="relative flex h-full w-full overflow-hidden">
        {/* ================= SIDEBAR ================= */}
        {showSidebar && (
          <div
            className={`
              fixed inset-0 z-40
              md:relative md:z-auto
              w-full md:w-[360px]
              h-full flex flex-col
              bg-[#111b21]
              border-r border-black/30
            `}
          >
            {/* ================= HEADER ================= */}
            <div className="sticky top-0 z-10 backdrop-blur-md bg-[#111b21]/80 border-b border-white/5 shadow-sm">
              <div className="flex items-center justify-between px-4 py-3">
                {/* LEFT: AVATAR + NAME */}
                <div className="flex items-center gap-3 min-w-0">
  <div className="relative">
    <img
      src={user?.avatar || "/default-avatar.png"}
      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-gradient-to-tr from-[#53bdeb] to-[#0af7a1]"
      alt="user"
    />
  </div>

  {/* USER NAME */}
  <span className="text-sm sm:text-base font-semibold text-white truncate">
    {user?.username || user?.name}
  </span>
</div>


                {/* RIGHT: CLOSE BUTTON */}
                <button
                  onClick={handleClose}
                  className="text-gray-300 hover:text-white transition p-1 rounded-full"
                >
                  <CloseIcon fontSize="small" />
                </button>
              </div>
            </div>

            {/* ================= SEARCH ================= */}
            <div className="px-3 py-2 border-b border-black/20">
              <UserSearchInput onSelectChat={handleSelectChat} />
            </div>

            {/* ================= TABS ================= */}
            <div className="flex border-b border-black/20">
              <button
                onClick={() => setActiveTab("inbox")}
                className={`flex-1 py-2 text-sm transition ${
                  activeTab === "inbox"
                    ? "border-b-2 border-[#00a884] text-[#00a884]"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Inbox
              </button>

              <button
                onClick={() => setActiveTab("requests")}
                className={`flex-1 py-2 text-sm transition ${
                  activeTab === "requests"
                    ? "border-b-2 border-[#00a884] text-[#00a884]"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Requests
              </button>
            </div>

            {/* ================= LIST ================= */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {activeTab === "inbox" && (
                <InboxList onSelectChat={handleSelectChat} />
              )}
              {activeTab === "requests" && (
                <RequestList onSelectChat={handleSelectChat} />
              )}
            </div>
          </div>
        )}

        {/* ================= CHAT ================= */}
        <div className="flex-1 h-full bg-[#0b141a]">
          <ChatScreen
            onBack={
              isMobile && !showSidebar ? () => setShowSidebar(true) : null
            }
          />
        </div>
      </div>
    </div>
  );
};

export default InstagramDMModal;


