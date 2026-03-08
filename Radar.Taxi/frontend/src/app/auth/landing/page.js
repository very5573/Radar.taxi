"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

import PersonIcon from "@mui/icons-material/Person";
import DriveEtaIcon from "@mui/icons-material/DriveEta";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

  // ✅ Already logged in → redirect automatically
  useEffect(() => {
    if (user?.role === "driver") {
      router.replace("/driver/home");
    } 
    else if (user?.role === "rider") {
      router.replace("/rider/home");
    }
  }, [user, router]);

  const handleRoleSelect = (role) => {
    if (role === "rider") {
      router.push("/auth/registerRider");
    } else {
      router.push("/auth/registerDriver");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-indigo-600 text-white space-y-6">

        <h1 className="text-3xl font-bold text-center">
          Welcome to Radar Taxi
        </h1>

        <p className="text-center text-lg max-w-md">
          Choose how you want to use the app.
        </p>

        {!user && (
          <div className="flex gap-6 mt-8">

            <button
              onClick={() => handleRoleSelect("rider")}
              className="flex flex-col items-center px-8 py-6 bg-white text-indigo-600 rounded-xl shadow-lg hover:scale-105 transition"
            >
              <PersonIcon className="text-4xl mb-2" />
              I want to Ride
            </button>

            <button
              onClick={() => handleRoleSelect("driver")}
              className="flex flex-col items-center px-8 py-6 bg-white text-indigo-600 rounded-xl shadow-lg hover:scale-105 transition"
            >
              <DriveEtaIcon className="text-4xl mb-2" />
              I want to Drive
            </button>

          </div>
        )}

      </div>

      <div className="flex-1 flex items-center justify-center text-gray-600">
        {user && (
          <p className="text-lg">
            Redirecting to your dashboard...
          </p>
        )}
      </div>

    </div>
  );
}