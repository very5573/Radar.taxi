"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import API from "../../../utils/axiosInstance";
import socket from "../../../utils/socket";
import { useRouter } from "next/navigation";
export default function DriverHome() {
  const [dashboard, setDashboard] = useState({
    todayRides: 0,
    todayEarnings: 0,
    isOnline: false,
  });

  const [isOnline, setIsOnline] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingRide, setIncomingRide] = useState(null);
  const [activeRideId, setActiveRideId] = useState(null);

  const [location, setLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);

  const [loading, setLoading] = useState(true);

  const currentUser = useSelector((state) => state.auth.user);

  const driverId = currentUser?._id || currentUser?.id;

  // ================= LOAD DASHBOARD =================
const router = useRouter();
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get("/dashboard");

        setDashboard(res.data.data);

        setIsOnline(res.data.data.isOnline);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

useEffect(() => {
  if (!driverId || onlineUsers === null) return; // wait for first snapshot

  const online = onlineUsers.includes(driverId);

  console.log("🟢 Socket Online Status:", online);

  setIsOnline(online);
}, [onlineUsers, driverId]);

// ================= SOCKET ONLINE LISTENER =================
useEffect(() => {
  if (!driverId) return;

  // ---------- SNAPSHOT ----------
  const handleSnapshot = (data) => {
    console.log("📡 Snapshot:", data.onlineUsers);
    setOnlineUsers(data.onlineUsers || []);
  };

  // ---------- USER ONLINE ----------
  const handleOnline = ({ userId }) => {
    console.log("🟢 User Online:", userId);

    setOnlineUsers((prev) => {
      if (!prev) return [userId]; // first event before snapshot
      if (prev.includes(userId)) return prev;
      return [...prev, userId];
    });
  };

  // ---------- USER OFFLINE ----------
  const handleOffline = ({ userId }) => {
    console.log("🔴 User Offline:", userId);

    setOnlineUsers((prev) => {
      if (!prev) return [];
      return prev.filter((id) => id !== userId);
    });
  };

  // ---------- SOCKET LISTEN ----------
  socket.on("onlineUsersSnapshot", handleSnapshot);
  socket.on("userOnline", handleOnline);
  socket.on("userOffline", handleOffline);

  // ---------- CLEANUP ----------
  return () => {
    socket.off("onlineUsersSnapshot", handleSnapshot);
    socket.off("userOnline", handleOnline);
    socket.off("userOffline", handleOffline);
  };
}, [driverId]);
  // ================= GEO SUPPORT CHECK =================

  useEffect(() => {
    console.log("Geolocation supported:", !!navigator.geolocation);
  }, []);

  // ================= SOCKET CONNECTION =================

  useEffect(() => {
    if (!driverId) return;

    socket.auth = {
      userId: driverId,
    };

    if (!socket.connected) {
      socket.connect();

      console.log("🔌 Connecting socket for driver:", driverId);
    }

    const handleRide = (ride) => {
      console.log("📩 New ride assigned:", ride);

      setIncomingRide(ride);
    };


    socket.on("newRideAssigned", handleRide);

    return () => {

      socket.off("newRideAssigned", handleRide);
    };
  }, [driverId]);

  // ================= DRIVER LIVE LOCATION =================

  useEffect(() => {
    if (!driverId || !isOnline) return;

    let latestCoords = null;

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;

        latestCoords = {
          latitude,

          longitude,
        };

        setLocation(latestCoords);

        console.log("📍 GPS:", latitude, longitude);
      },

      (err) => console.error("❌ Location error:", err),

      {
        enableHighAccuracy: true,

        maximumAge: 1000,

        timeout: 10000,
      },
    );

    const intervalId = setInterval(() => {
      if (latestCoords) {
        socket.emit("driverLocationUpdate", {
          rideId: activeRideId || null,

          latitude: latestCoords.latitude,

          longitude: latestCoords.longitude,
        });

        setDriverLocation(latestCoords);
      }
    }, 5000);

    return () => {
      navigator.geolocation.clearWatch(watchId);

      clearInterval(intervalId);
    };
  }, [driverId, isOnline, activeRideId]);

  // ================= ACTIVE RIDE ROOM =================

  useEffect(() => {
    if (!activeRideId) return;

    console.log("🚪 Join ride:", activeRideId);

    socket.emit("joinRideRoom", activeRideId);

    const riderHandler = ({ latitude, longitude }) => {
      setRiderLocation({
        latitude,

        longitude,
      });
    };

    const driverHandler = ({ latitude, longitude }) => {
      setDriverLocation({
        latitude,

        longitude,
      });
    };

    socket.on("updateRiderLocation", riderHandler);

    socket.on("updateDriverLocation", driverHandler);

    return () => {
      socket.off("updateRiderLocation", riderHandler);

      socket.off("updateDriverLocation", driverHandler);
    };
  }, [activeRideId]);

  // ================= ACCEPT RIDE =================

  const handleAccept = async () => {
      console.log("Ride ID to accept:", incomingRide.rideId);

    if (!incomingRide) return;

    try {
      await API.patch(`/accept-ride/${incomingRide.rideId}`);
 router.push(`/driver/trips/${incomingRide.rideId}`);

      setActiveRideId(incomingRide.rideId);

      setIncomingRide(null);
    } catch (err) {
      console.error("Accept ride error:", err);
    }
  };

  // ================= REJECT RIDE =================

  const handleReject = async () => {
    if (!incomingRide) return;

    try {
      await API.patch(`/reject-ride/${incomingRide.rideId}`);

      setIncomingRide(null);
    } catch (err) {
      console.error("Reject ride error:", err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-lg font-semibold text-gray-600">
        Live Map (Driver Location Updating...)
      </div>

      <div className="absolute top-6 right-6 z-20">
  <div
    className={`px-5 py-2 rounded-full shadow-xl text-white font-semibold ${
      onlineUsers === null // first snapshot wait
        ? "bg-gray-400"
        : isOnline
        ? "bg-green-600"
        : "bg-gray-800"
    }`}
  >
    {onlineUsers === null
      ? "Checking..."
      : isOnline
      ? "Online (Realtime)"
      : "Offline"}
  </div>
</div>

      <div className="absolute top-6 left-6 bg-white px-4 py-2 rounded-xl shadow-lg z-20">
        <p className="text-sm text-gray-500">Today</p>

        <p className="font-bold">
          ₹{dashboard.todayEarnings}•{dashboard.todayRides}
          rides
        </p>
      </div>

      {incomingRide && (
        <div className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-2xl p-6 z-30">
          <h2 className="text-xl font-bold mb-3">New Ride Request 🚕</h2>

          <p className="text-gray-600">
            Fare:
            <span className="font-bold">₹{incomingRide.fare}</span>
          </p>

          <p className="text-gray-600 mt-1">
            Pickup:
            {incomingRide.pickupAddress}
          </p>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleAccept}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl text-lg"
            >
              Accept
            </button>

            <button
              onClick={handleReject}
              className="flex-1 bg-gray-200 py-3 rounded-xl text-lg"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
