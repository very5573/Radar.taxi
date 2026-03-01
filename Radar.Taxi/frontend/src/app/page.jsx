"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

// MUI Icons import
import PersonIcon from '@mui/icons-material/Person';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import PlaceIcon from '@mui/icons-material/Place';
import HistoryIcon from '@mui/icons-material/History';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useSelector(state => state.auth); // Redux se user
  const [activeTab, setActiveTab] = useState("home"); // bottom nav active

  /* ✅ Already logged-in user → Role-based redirect */
  useEffect(() => {
    if (user) {
      if (user.role === "driver") {
        router.replace("/driver/home");
      } else {
        router.replace("/rider/home");
      }
    }
  }, [user, router]);

  const handleRoleSelect = (selectedRole) => {
    // Role ke according registration page navigate karna
    if (selectedRole === "rider") {
      router.push("/auth/registerRider");
    } else if (selectedRole === "driver") {
      router.push("/auth/registerDriver");
    }
  };

  const role = user?.role || ""; // logged-in user role ya empty

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center py-16 px-6 bg-indigo-600 text-white space-y-6">
        <h1 className="text-3xl font-bold text-center">Welcome to Radar Taxi</h1>
        <p className="text-center text-lg max-w-md">
          Choose how you want to use the app: get a ride or drive and earn.
        </p>

        {/* Role Selection */}
        {!role && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => handleRoleSelect("rider")}
              className="flex flex-col items-center justify-center px-6 py-6 rounded-xl shadow-lg transition transform bg-indigo-500 text-white hover:scale-105"
            >
              <PersonIcon className="text-3xl mb-2" />
              I want to Ride
            </button>

            <button
              onClick={() => handleRoleSelect("driver")}
              className="flex flex-col items-center justify-center px-6 py-6 rounded-xl shadow-lg transition transform bg-indigo-500 text-white hover:scale-105"
            >
              <DriveEtaIcon className="text-3xl mb-2" />
              I want to Drive
            </button>
          </div>
        )}
      </div>

      {/* Main Content Placeholder */}
      <div className="flex-1 flex flex-col items-center justify-center text-gray-700">
        {role ? (
          <p className="text-xl mt-8">
            Logged in as <strong>{role}</strong>. Redirecting to your dashboard...
          </p>
        ) : (
          <p className="text-lg mt-8">Select your role to continue</p>
        )}
      </div>

      {/* Bottom Navigation */}
      {role && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex justify-around py-2">
          {[
            { id: "home", icon: <PlaceIcon fontSize="small" />, label: "Home" },
            { id: "trips", icon: <HistoryIcon fontSize="small" />, label: "Trips" },
            { id: "wallet", icon: <AccountBalanceWalletIcon fontSize="small" />, label: "Wallet" },
            { id: "profile", icon: <AccountCircleIcon fontSize="small" />, label: "Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                router.push(`/${role}/${tab.id}`); // role-based routing
              }}
              className={`flex flex-col items-center justify-center ${
                activeTab === tab.id ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              {tab.icon}
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}