import { useEffect } from "react";
import { useSelector } from "react-redux";
import socket from "../../utils/socket";

export default function RiderSocketListener({ rideId }) {
  const currentUser = useSelector((state) => state.auth.user);
  const riderId = currentUser?._id;

  useEffect(() => {
    if (!riderId || !rideId) return;

    if (!socket.connected) {
      socket.connect();
    }

    // ✅ Join ride room
    socket.emit("joinRideRoom", rideId);

    // ✅ Emit rider location
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;

        socket.emit("riderLocationUpdate", {
          rideId,
          latitude,
          longitude,
        });
      },
      (err) => console.error("Rider location error:", err),
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    // ✅ Listen driver location updates
    const handleDriverUpdate = ({ driverId, latitude, longitude }) => {
      console.log("Driver location updated:", driverId, latitude, longitude);
      // TODO: Update rider map marker
    };

    socket.on("updateDriverLocation", handleDriverUpdate);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off("updateDriverLocation", handleDriverUpdate);
    };
  }, [riderId, rideId]);

  return null;
}