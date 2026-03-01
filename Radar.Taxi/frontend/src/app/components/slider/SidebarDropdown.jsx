"use client";

import LockIcon from "@mui/icons-material/Lock";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { logoutUser } from "./logoutFunction";

function SidebarDropdown({ open, setOpen }) {
  const dispatch = useDispatch();
  const router = useRouter();

  if (!open) return null;

  const handleClose = () => setOpen(false);

  const handlePassword = () => {
    router.push("/auth/password");
    handleClose();
  };

  const handleLogout = () => {
    logoutUser(dispatch, router);
    handleClose();
  };

  return (
    <div className="absolute left-full bottom-0 ml-2 w-60 rounded-2xl
                    border border-gray-200 bg-white shadow-xl z-50">
      <button
        onClick={handlePassword}
        className="flex w-full items-center gap-3 px-4 py-3
                   hover:bg-gray-100 transition rounded-lg"
      >
        <LockIcon fontSize="small" className="text-gray-700" />
        <span className="font-medium">Change Password</span>
      </button>

      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 px-4 py-3
                   hover:bg-red-50 transition rounded-lg"
      >
        <LogoutIcon fontSize="small" className="text-red-600" />
        <span className="font-semibold text-red-600">Logout</span>
      </button>

      <div className="my-1 h-px bg-gray-200" />

      <button
        onClick={handleClose}
        className="flex w-full items-center gap-3 px-4 py-3
                   hover:bg-gray-100 transition rounded-lg"
      >
        <CloseIcon fontSize="small" className="text-gray-500" />
        <span className="text-gray-600">Cancel</span>
      </button>
    </div>
  );
}

export default SidebarDropdown;
