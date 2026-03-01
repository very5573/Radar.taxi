"use client";

import { useEffect, useRef } from "react";
import LocationOnIcon from "@mui/icons-material/LocationOn";

export default function LocationForm({
  pickupLatitude,
  setPickupLatitude,
  pickupLongitude,
  setPickupLongitude,
  pickupAddress,
  setPickupAddress,
  dropoffAddress,
  setDropoffAddress,
  setDropoffCoordinates, // from HomePage
}) {
  const debounceRef = useRef(null);

  // ---------------- PICKUP LOCATION ----------------
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        setPickupLatitude(lat);
        setPickupLongitude(lng);
        setPickupAddress(`Lat: ${lat}, Lng: ${lng}`);
      },
      (error) => {
        console.error("Error getting location:", error.message);
        setPickupLatitude("");
        setPickupLongitude("");
        setPickupAddress("");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ---------------- DROP-OFF INPUT ----------------
  const handleDropoffChange = (e) => {
    const value = e.target.value;
    setDropoffAddress(value);

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Debounce API call by 500ms
    debounceRef.current = setTimeout(async () => {
      const trimmed = value.trim();

      if (!trimmed) {
        setDropoffCoordinates(null, null);
        return;
      }

      // Check if user typed lat,lng
      const coords = trimmed.split(",").map((v) => parseFloat(v.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        setDropoffCoordinates(coords[0], coords[1]);
        return;
      }

      // ---------------- FREE GEOCODING ----------------
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            trimmed
          )}`
        );
        const data = await res.json();

        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setDropoffCoordinates(lat, lon);
        } else {
          console.warn("Address not found:", trimmed);
          setDropoffCoordinates(null, null);
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        setDropoffCoordinates(null, null);
      }
    }, 500); // 500ms debounce
  };

  return (
    <div className="flex flex-col gap-6 bg-gray-900 p-4 rounded-2xl border border-gray-800">
      {/* ---------- Pickup Location ---------- */}
      <div className="flex flex-col bg-gray-800 p-4 rounded-2xl border border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <LocationOnIcon />
          <input
            placeholder="Pickup Address / Coordinates"
            type="text"
            value={pickupAddress || ""}
            readOnly
            className="bg-transparent outline-none w-full cursor-not-allowed"
          />
        </div>
        <div className="flex gap-3 mt-2">
          <input
            placeholder="Pickup Latitude"
            type="text"
            value={pickupLatitude ?? ""}
            readOnly
            className="bg-transparent outline-none w-1/2 cursor-not-allowed"
          />
          <input
            placeholder="Pickup Longitude"
            type="text"
            value={pickupLongitude ?? ""}
            readOnly
            className="bg-transparent outline-none w-1/2 cursor-not-allowed"
          />
        </div>
      </div>

      {/* ---------- Drop-off Location ---------- */}
      <div className="flex flex-col bg-gray-800 p-4 rounded-2xl border border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <LocationOnIcon />
          <input
            placeholder="Drop-off Address or lat,lng"
            type="text"
            value={dropoffAddress || ""}
            onChange={handleDropoffChange}
            className="bg-transparent outline-none w-full"
          />
        </div>
      </div>
    </div>
  );
}