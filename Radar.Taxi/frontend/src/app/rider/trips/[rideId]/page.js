"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import socketInstance from "../../../../utils/socket";
import API from "../../../../utils/axiosInstance";

export default function TripPage() {
  const params = useParams();
  const rideId = params?.rideId;

  console.log("RideId =", rideId);

  const [driverLocation, setDriverLocation] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [driverName, setDriverName] = useState("Driver");

  const socket = socketInstance;

  // ---------------- LOAD RIDE DATA ----------------

  useEffect(() => {
    if (!rideId) return;

    const loadRide = async () => {
      try {
        const { data } = await API.get("/ride/" + rideId);

        setDriverName(data?.ride?.driver?.name || "Driver");
      } catch (error) {
        console.log("Ride load error:", error);
      }
    };

    loadRide();
  }, [rideId]);

  // ---------------- WATCH RIDER LOCATION ----------------

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setRiderLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },

      (err) => console.log(err),

      {
        enableHighAccuracy: true,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ---------------- SOCKET DRIVER LOCATION ----------------

  useEffect(() => {
    if (!rideId) return;

    socket.connect();

    socket.emit("joinRideRoom", rideId);

    const handleDriverLocation = (data) => {
      setDriverLocation({
        lat: data.latitude,
        lng: data.longitude,
      });
    };

    socket.on("updateDriverLocation", handleDriverLocation);

    return () => {
      socket.off("updateDriverLocation", handleDriverLocation);
    };
  }, [rideId]);

  // ---------------- SEND RIDER LOCATION ----------------

  useEffect(() => {
    if (!rideId) return;

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          socket.emit("riderLocationUpdate", {
            rideId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },

        (err) => console.log(err),
      );
    };

    sendLocation();

    const interval = setInterval(sendLocation, 3000);

    return () => clearInterval(interval);
  }, [rideId]);

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="h-[70vh] bg-gray-800 flex items-center justify-center">
        Map Loading...
      </div>

      <div className="bg-gray-900 p-5 rounded-t-3xl">
        <h2 className="text-xl font-bold">Driver Arriving</h2>

        <p className="text-lg">{driverName}</p>

        <hr className="my-3" />

        <div>
          <p>📍 Rider Location</p>

          <p>
            {riderLocation?.lat || "Loading"} {riderLocation?.lng || ""}
          </p>
        </div>

        <div>
          <p>🚗 Driver Location</p>

          <p>
            {driverLocation?.lat || "Waiting"} {driverLocation?.lng || ""}
          </p>
        </div>
      </div>
    </div>
  );
}
