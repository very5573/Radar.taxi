import { useEffect } from "react";
import { useSelector } from "react-redux";
import socket from "../../utils/socket";

export default function DriverSocketListener({ rideId }) {
  const currentUser = useSelector((state) => state.auth.user);
  const driverId = currentUser?._id;

  useEffect(() => {
    if (!driverId || !rideId) return;

    if (!socket.connected) {
      socket.connect();
    }

    // ✅ Join ride room
    socket.emit("joinRideRoom", rideId);

    // ✅ Emit driver location
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;

        socket.emit("driverLocationUpdate", {
          rideId,
          driverId,
          latitude,
          longitude,
        });
      },
      (err) => console.error("Driver location error:", err),
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    // ✅ Listen rider location updates
    const handleRiderUpdate = ({ latitude, longitude }) => {
      console.log("Rider location updated:", latitude, longitude);
      // TODO: Update driver map marker
    };

    socket.on("updateRiderLocation", handleRiderUpdate);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off("updateRiderLocation", handleRiderUpdate);
    };
  }, [driverId, rideId]);

  return null;
}