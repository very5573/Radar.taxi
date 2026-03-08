"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import socketInstance from "../../../utils/socket";
import BottomNav from "../../components/BottomNav";
import LocationForm from "../../Rapido/LocationForm";
import RideSelector from "../../Rapido/RideSelector";
import API from "../../../utils/axiosInstance"; // 🔹 Axios instance

export default function HomePage() {
  const [selectedRide, setSelectedRide] = useState(null);

  // Pickup state
  const [pickupLatitude, setPickupLatitude] = useState("");
  const [pickupLongitude, setPickupLongitude] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");

  // Dropoff state
  const [dropoffLatitude, setDropoffLatitude] = useState("");
  const [dropoffLongitude, setDropoffLongitude] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isOnline, setIsOnline] = useState(false);

  const currentUser = useSelector((state) => state.auth.user);
  const riderId = currentUser?._id || currentUser?.id;
  const router = useRouter();
  const [rideId, setRideId] = useState(null);
  const [driverId, setDriverId] = useState(null);

  const riderCoordsRef = useRef({ latitude: null, longitude: null });
  const driverCoordsRef = useRef({ latitude: null, longitude: null });

  // ---------------- DROP-OFF COORDINATES HANDLING ----------------
  const setDropoffCoordinates = (lat, lon) => {
    if (lat == null || lon == null) {
      console.warn("Latitude and longitude required for drop-off");
      setDropoffLatitude(null);
      setDropoffLongitude(null);
      return;
    }
    setDropoffLatitude(Number(lat));
    setDropoffLongitude(Number(lon));
  };
// ---------------- SOCKET INITIALIZATION ----------------
useEffect(() => {
  if (!riderId) return;

  const newSocket = socketInstance;

  // Attach auth before connecting
  newSocket.auth = { userId: riderId };

  // Connect only if not already connected
  if (!newSocket.connected) {
    newSocket.connect();
  }

  setSocket(newSocket);

  // ---------------- CONNECTION EVENTS ----------------
  const handleConnect = () => {
    console.log("Socket connected:", newSocket.id);
  };

  const handleDisconnect = (reason) => {
    console.log("Socket disconnected:", reason);
  };

  // ---------------- RIDE ACCEPTED ----------------
  const handleRideAccepted = (data) => {
    alert("🚕 Driver accepted your ride!");

    setRideId(data.rideId);
    setDriverId(data.driverId);

    // Redirect only after acceptance
    router.push(`/rider/trips/${data.rideId}`);
  };

  // ---------------- RIDE REJECTED ----------------
  const handleRideRejected = () => {
    alert("❌ Driver rejected your ride. Searching another driver...");
  };

  // Attach listeners
  newSocket.on("connect", handleConnect);
  newSocket.on("disconnect", handleDisconnect);
  newSocket.on("rideAccepted", handleRideAccepted);
  newSocket.on("rideRejected", handleRideRejected);

  // ---------------- CLEANUP ----------------
  return () => {
    newSocket.off("connect", handleConnect);
    newSocket.off("disconnect", handleDisconnect);
    newSocket.off("rideAccepted", handleRideAccepted);
    newSocket.off("rideRejected", handleRideRejected);
  };

}, [riderId, router]);

  // ---------------- FETCH AVAILABLE RIDES ----------------
  useEffect(() => {
    const fetchRides = async () => {
      try {
        // Convert coordinates to numbers
        const pickupLatNum = Number(pickupLatitude);
        const pickupLngNum = Number(pickupLongitude);
        const dropoffLatNum = Number(dropoffLatitude);
        const dropoffLngNum = Number(dropoffLongitude);

        // Send GET request with query params
        const { data } = await API.get("/available", {
          params: {
            pickupLatitude: pickupLatNum,
            pickupLongitude: pickupLngNum,
            dropoffLatitude: dropoffLatNum,
            dropoffLongitude: dropoffLngNum,
          },
        });

        setAvailableRides(data.rides || []);
      } catch (error) {
        console.error("Error fetching rides:", error?.response?.data ?? error);
        setAvailableRides([]); // Reset rides on error
      }
    };

    // Only fetch if all coordinates are valid numbers
    if (
      pickupLatitude &&
      pickupLongitude &&
      dropoffLatitude &&
      dropoffLongitude
    ) {
      fetchRides();
    }
  }, [pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude]);

  // ---------------- BOOK RIDE ----------------

  const handleBookRide = async () => {
    // Ride select जरूरी
    if (!selectedRide) {
      setMessage("Please select ride");

      return;
    }

    setLoading(true);

    setMessage("");

    try {
      // ---------------- API CALL ----------------

      const { data } = await API.post("/request", {
        pickupLatitude: Number(pickupLatitude),

        pickupLongitude: Number(pickupLongitude),

        dropoffLatitude: Number(dropoffLatitude),

        dropoffLongitude: Number(dropoffLongitude),

        fare: selectedRide.fare,

        rideType: selectedRide,

        pickupAddress,

        dropoffAddress,
      });

      // ---------------- SAVE DATA ----------------

      setMessage(data.message);

      setRideId(data.rideId);


      console.log("Ride Created:", data.rideId);

      // ---------------- SOCKET JOIN ----------------

      if (socket && data.rideId) {
        socket.emit("joinRideRoom", data.rideId);
      }

      // ⭐ MOST IMPORTANT
      // Trip Page Redirect

    } catch (error) {
      console.error(error?.response?.data ?? error);

      setMessage("Ride booking failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REAL-TIME LOCATION UPDATES ----------------
  useEffect(() => {
    if (!riderId || !rideId || !socket) return;

    if (!socket.connected) socket.connect();
    socket.emit("joinRideRoom", rideId);

    const updateRiderLocation = () => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const { latitude, longitude } = coords;
          riderCoordsRef.current = { latitude, longitude };
          socket.emit("riderLocationUpdate", { rideId, latitude, longitude });
        },
        (err) => console.error("Rider location error:", err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
      );
    };

    updateRiderLocation();
    const intervalId = setInterval(updateRiderLocation, 5000);

    const handleDriverUpdate = ({ driverId, latitude, longitude }) => {
      driverCoordsRef.current = { latitude, longitude };
      console.log("Driver location updated:", driverId, latitude, longitude);
    };

    socket.on("updateDriverLocation", handleDriverUpdate);

    const handleRiderUpdate = ({ latitude, longitude }) => {
      riderCoordsRef.current = { latitude, longitude };
      console.log("Rider location updated on server:", latitude, longitude);
    };

    socket.on("updateRiderLocation", handleRiderUpdate);

    return () => {
      clearInterval(intervalId);
      socket.off("updateDriverLocation", handleDriverUpdate);
      socket.off("updateRiderLocation", handleRiderUpdate);
    };
  }, [riderId, rideId, socket]);

  // ---------------- SOCKET ONLINE STATUS ----------------
  useEffect(() => {
    if (!driverId || onlineUsers === null) return;
    setIsOnline(onlineUsers.includes(driverId));
  }, [onlineUsers, driverId]);

  useEffect(() => {
    if (!driverId || !socket) return;

    const handleSnapshot = (data) => setOnlineUsers(data.onlineUsers || []);
    const handleOnline = ({ userId }) =>
      setOnlineUsers((prev) =>
        prev?.includes(userId) ? prev : [...(prev || []), userId],
      );
    const handleOffline = ({ userId }) =>
      setOnlineUsers((prev) => prev?.filter((id) => id !== userId) || []);

    socket.on("onlineUsersSnapshot", handleSnapshot);
    socket.on("userOnline", handleOnline);
    socket.on("userOffline", handleOffline);

    return () => {
      socket.off("onlineUsersSnapshot", handleSnapshot);
      socket.off("userOnline", handleOnline);
      socket.off("userOffline", handleOffline);
    };
  }, [driverId, socket]);

  return (
    <div className="bg-gray-950 text-white min-h-screen pb-24">
      {/* MAP PLACEHOLDER */}
      <div className="p-56 bg-amber-50 flex items-center justify-center">
        <p className="text-gray-400">Map Loading...</p>
      </div>

      {/* LOCATION INPUT */}
      <div className="p-5 space-y-3">
        <LocationForm
          pickupLatitude={pickupLatitude}
          setPickupLatitude={setPickupLatitude}
          pickupLongitude={pickupLongitude}
          setPickupLongitude={setPickupLongitude}
          pickupAddress={pickupAddress}
          setPickupAddress={setPickupAddress}
          dropoffLatitude={dropoffLatitude}
          setDropoffLatitude={setDropoffLatitude}
          dropoffLongitude={dropoffLongitude}
          setDropoffLongitude={setDropoffLongitude}
          dropoffAddress={dropoffAddress}
          setDropoffAddress={setDropoffAddress}
          setDropoffCoordinates={setDropoffCoordinates}
        />
      </div>

      {/* RIDE SELECTION + BOOK BUTTON */}
      <RideSelector
        selectedRide={selectedRide}
        setSelectedRide={setSelectedRide}
        loading={loading}
        handleBookRide={handleBookRide}
        availableRides={availableRides}
      />

      {/* BOTTOM NAV */}
      <BottomNav />
    </div>
  );
}
