"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";

import BottomNav from "../../components/BottomNav";
import { logoutUser } from "../../components/slider/logoutFunction";

import LockIcon from "@mui/icons-material/Lock";
import LogoutIcon from "@mui/icons-material/Logout";
import SendIcon from "@mui/icons-material/Send";

export default function ProfilePage() {
  const router = useRouter();

  const dispatch = useDispatch();

  // ✅ REDUX USER
  const { user, loading } = useSelector((state) => state.auth);

  // 🔥 Loading state
  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // 🔥 Change Password
  const handlePassword = () => {
    router.push("/auth/password");
  };

  // 🔥 Logout
  const handleLogout = () => {
    logoutUser(dispatch, router);
  };

  // 🔥 Open Messages
  const handleMessages = () => {
    router.push("/messages");
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-100">
      {/* Header */}

      <div className="bg-indigo-600 text-white p-6 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar}
              alt="avatar"
              className="w-16 h-16 rounded-full border-2 border-white object-cover"
            />

            <div>
              <h2 className="text-xl font-bold">{user?.name}</h2>

              <p className="text-sm opacity-90">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleMessages}
            className="bg-white text-indigo-600 p-3 rounded-full shadow"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Role</p>

          <p className="font-semibold capitalize">{user.role}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">User ID</p>

          <p className="font-semibold">{user.id}</p>
        </div>

        <div className="bg-white rounded-xl shadow">
          <button
            onClick={handlePassword}
            className="flex w-full items-center gap-3 px-4 py-4 border-b"
          >
            <LockIcon />

            <span>Change Password</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-4 text-red-600"
          >
            <LogoutIcon />

            <span>Logout</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
