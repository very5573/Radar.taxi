"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import PersonIcon from "@mui/icons-material/Person";
import DoneAllIcon from "@mui/icons-material/DoneAll";

import useMessageSelectDelete from "./useMessageSelectDelete";

export default function MessageSelectDelete({
  conversationId,
  messages,
  renderMessages,
  setMessages
}) {
  const {
    selectMode,
    selectedMessages,
    showModal,
    setShowModal,
    toggleSelect,
    resetSelect,
    deleteForMe,
    deleteForEveryone,
    selectAllMessages,
  } = useMessageSelectDelete({ conversationId, messages, setMessages });

  return (
    <>
      {/* 🔹 Messages List */}
      <div className="flex flex-col gap-1 relative pb-20">
        {messages.map((msg) => {
          const isSelected = selectedMessages.includes(msg._id);

          return (
            <div
              key={msg._id}
              onClick={() => toggleSelect(msg._id)}
              onContextMenu={(e) => {
                e.preventDefault();
                toggleSelect(msg._id);
              }}
              className={`relative rounded-lg transition-all 
                ${isSelected ? "bg-blue-100 dark:bg-gray-800 scale-[0.98]" : ""}
              `}
            >
              {selectMode && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelect(msg._id);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-5 h-5 accent-blue-600"
                />
              )}

              <div className={`pl-${selectMode ? "10" : "2"} pr-2 py-1`}>
                {renderMessages(msg, { selectMode })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🗑 Bottom Action Bar */}
      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-3 py-2 flex items-center justify-between">
            {/* Selected Count */}
            <div className="flex items-center gap-2 text-sm font-medium">
              <PersonIcon fontSize="small" />
              {selectedMessages.length} selected
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllMessages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
              >
                <DoneAllIcon fontSize="small" />
                <span className="hidden sm:inline">Select All</span>
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm"
              >
                <DeleteIcon fontSize="small" />
                <span className="hidden sm:inline">Delete</span>
              </button>

              <button
                onClick={resetSelect}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-300 dark:bg-gray-700 text-sm"
              >
                <ClearIcon fontSize="small" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🧾 Delete Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="w-full sm:w-96 bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-5 animate-slide-up">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <DeleteForeverIcon className="text-red-600" />
              Delete messages?
            </h3>

            <div className="flex flex-col gap-3">
              <button
                onClick={deleteForMe}
                className="w-full py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
              >
                Delete for Me
              </button>

              <button
                onClick={deleteForEveryone}
                className="w-full py-2 rounded-lg bg-red-600 text-white"
              >
                Delete for Everyone
              </button>

              <button
                onClick={resetSelect}
                className="w-full py-2 rounded-lg bg-gray-300 dark:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
