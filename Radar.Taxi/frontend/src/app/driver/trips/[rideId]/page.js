"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import socketInstance from "../../../../utils/socket";
import API from "../../../../utils/axiosInstance";

export default function DriverTripPage() {
  const { rideId } = useParams();

  console.log("Driver RideId =", rideId);

  const socket = socketInstance;

  const [riderLocation, setRiderLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  const [riderName, setRiderName] = useState("");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");

  // ========================
  // Load Ride Details
  // ========================

  useEffect(() => {
    if (!rideId) return;

    const loadRide = async () => {
      try {
        const { data } = await API.get("/ride/" + rideId);

        setRiderName(data.ride.user?.name || "Rider");

        setPickup(data.ride.pickup);

        setDrop(data.ride.drop);
      } catch (error) {
        console.log(error);
      }
    };

    loadRide();
  }, [rideId]);

  // ========================
  // Join Ride Room
  // ========================

  useEffect(() => {
    if (!rideId) return;

    socket.emit("joinRideRoom", rideId);
  }, [rideId]);

  // ========================
  // Receive Rider Location
  // ========================

  useEffect(() => {
    if (!rideId) return;

    socket.on("updateRiderLocation", (data) => {
      setRiderLocation({
        lat: data.latitude,
        lng: data.longitude,
      });
    });

    return () => {
      socket.off("updateRiderLocation");
    };
  }, [rideId]);

  // ========================
  // Send Driver Location
  // ========================

  useEffect(() => {
    if (!rideId) return;

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition((pos) => {
        setDriverLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });

        socket.emit(
          "driverLocationUpdate",

          {
            rideId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
        );
      });
    };

    updateLocation();

    const interval = setInterval(updateLocation, 3000);

    return () => clearInterval(interval);
  }, [rideId]);

  return (
    <div className="bg-black min-h-screen text-white">
      {/* MAP */}

      <div className="h-[70vh] bg-gray-800 flex items-center justify-center">
        Map Loading...
      </div>

      {/* DETAILS */}

      <div className="bg-gray-900 p-5 rounded-t-3xl">
        <h2 className="text-xl font-bold">Going to Pickup</h2>

        <p className="text-lg">Rider: {riderName}</p>

        <hr className="my-3" />

        <div>
          <p>📍 Pickup</p>

          <p>{pickup}</p>
        </div>

        <div>
          <p>🏁 Drop</p>

          <p>{drop}</p>
        </div>

        <hr className="my-3" />

        <div>
          <p>📍 Rider Location</p>

          <p>
            {riderLocation?.lat} {riderLocation?.lng}
          </p>
        </div>

        <div>
          <p>🚗 Driver Location</p>

          <p>
            {driverLocation?.lat} {driverLocation?.lng}
          </p>
        </div>
      </div>
    </div>
  );
}
