"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AddBoxIcon from "@mui/icons-material/AddBox";

function PostDropdown({ expanded }) {
  const [open, setOpen] = useState(false);

  // ESC key se modal close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      {/* Sidebar Create Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-4 px-3 py-3 rounded-lg
                   hover:bg-gray-100 transition group"
      >
        <AddBoxIcon className="text-gray-700 group-hover:text-black transition" />

        {expanded && (
          <span className="text-sm font-medium text-gray-800 group-hover:text-black">
            Create
          </span>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="w-80 rounded-2xl bg-white p-6 shadow-xl
                       flex flex-col gap-3 animate-scaleIn"
          >
            <h2 className="text-lg font-semibold text-center text-gray-900">
              Create
            </h2>

            <Link
              href="/create-post"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-center
                         hover:bg-gray-100 transition font-medium"
            >
              Create Post
            </Link>

            <Link
              href="/create/story"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-center
                         hover:bg-gray-100 transition font-medium"
            >
              Create Story
            </Link>

            <Link
              href="/create/reel"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-center
                         hover:bg-gray-100 transition font-medium"
            >
              Create Reel
            </Link>

            <button
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg py-2 text-red-600
                         font-semibold hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default PostDropdown;
