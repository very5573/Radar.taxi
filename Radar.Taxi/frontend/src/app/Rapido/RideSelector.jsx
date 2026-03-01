"use client";

import React from "react";

export default function RideSelector({
  selectedRide,
  setSelectedRide,
  loading,
  handleBookRide,
  availableRides, 
}) {
  // Formatter for INR currency
  const formatFare = (fare) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(fare);

  return (
    <div className="px-5 mt-2">
      <h2 className="text-gray-400 mb-3">Choose Ride</h2>

      <div className="space-y-3">
        {availableRides && availableRides.length > 0 ? (
          availableRides.map((ride, index) => (
            <div
              key={ride.driverId} // unique key per driver
              onClick={() => setSelectedRide(ride)}
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                selectedRide?.driverId === ride.driverId
                  ? "bg-indigo-600 border-indigo-600"
                  : "bg-gray-900 border-gray-800"
              }`}
            >
              <div>
                <p className="font-semibold">
                  {ride.vehicle.vehicleType} - {ride.vehicle.model}
                </p>
                <p className="text-sm text-gray-400">Driver: {ride.name}</p>
              </div>
              <p className="font-bold">{formatFare(ride.fare)}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">Loading rides...</p>
        )}
      </div>

      <div className="p-5">
        <button
          disabled={!selectedRide || loading}
          onClick={handleBookRide}
          className={`w-full py-4 rounded-2xl font-bold transition ${
            selectedRide
              ? "bg-green-500 text-black hover:bg-green-600"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading
            ? "Requesting..."
            : selectedRide
            ? `Book ${selectedRide.vehicle.vehicleType}`
            : "Select Ride First"}
        </button>
      </div>
    </div>
  );
}