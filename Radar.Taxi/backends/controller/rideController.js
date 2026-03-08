import Ride from "../models/Ride.js";
import User from "../models/userModel.js";
import axios from "axios";

export const requestRide = async (req, res) => {
  try {
    const {
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
      fare,
      pickupAddress,
      dropoffAddress,
      rideType,
    } = req.body;

    if (
      pickupLatitude == null ||
      pickupLongitude == null ||
      dropoffLatitude == null ||
      dropoffLongitude == null ||
      fare == null
    ) {
      return res.status(400).json({
        success: false,
        message: "All ride details are required",
      });
    }

    const nearestDriver = await User.findOne({
      role: "driver",
      isOnline: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [pickupLongitude, pickupLatitude],
          },
          $maxDistance: 5000,
        },
      },
    });

    if (!nearestDriver) {
      return res.status(404).json({
        success: false,
        message: "No drivers nearby",
      });
    }

    const ride = await Ride.create({
      user: req.user.id,
      driver: nearestDriver._id,
      pickupLocation: {
        type: "Point",
        coordinates: [pickupLongitude, pickupLatitude],
      },
      dropoffLocation: {
        type: "Point",
        coordinates: [dropoffLongitude, dropoffLatitude],
      },
      pickupAddress,
      dropoffAddress,
      rideType,
      fare,
      status: "pending",
    });

    if (global.io) {
      global.io.to(nearestDriver._id.toString()).emit("newRideAssigned", {
        rideId: ride._id,
        pickupLatitude,
        pickupLongitude,
        dropoffLatitude,
        dropoffLongitude,
        pickupAddress,
        dropoffAddress,
        fare,
      });
    }

    res.status(201).json({
      success: true,
      message: "Ride request sent successfully",
      rideId: ride._id,
    });
  } catch (error) {
    console.error("❌ requestRide error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// 🔹 Get all available rides near rider
export const getAvailableRides = async (req, res) => {
  try {
    const {
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
    } = req.query;

    // ---------------- VALIDATION ----------------

    if (
      !pickupLatitude ||
      !pickupLongitude ||
      !dropoffLatitude ||
      !dropoffLongitude
    ) {
      return res.status(400).json({
        message: "Pickup and dropoff coordinates required",
      });
    }

    // ---------------- FIND NEAREST DRIVERS ----------------

    const drivers = await User.find({
      role: "driver",

      isActive: true,

      isOnline: true,

      currentRide: null,

      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(pickupLongitude), Number(pickupLatitude)],
          },
          $maxDistance: 5000,
        },
      },
    });

    // ---------------- MAP DRIVERS ----------------

    const rides = drivers.map((driver) => ({
      driverId: driver._id,

      name: driver.name,

      avatar: driver.avatar?.url || null,

      vehicle: driver.vehicle, // ✅ Vehicle Added

      fare: calculateFare(
        pickupLatitude,
        pickupLongitude,
        dropoffLatitude,
        dropoffLongitude,
      ),

      location: driver.location,
    }));

    // ---------------- RESPONSE ----------------

    res.status(200).json({
      success: true,

      rides,
    });
  } catch (error) {
    console.error("Error fetching available rides:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// 🔹 Fare Calculation

const calculateFare = (pickupLat, pickupLng, dropoffLat, dropoffLng) => {
  const distanceKm = getDistanceFromLatLonInKm(
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
  );

  const baseFare = 50;

  const perKmRate = 15;

  return Math.round(baseFare + distanceKm * perKmRate);
};

// 🔹 Distance Calculation

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const deg2rad = (deg) => deg * (Math.PI / 180);

  const R = 6371;

  const dLat = deg2rad(lat2 - lat1);

  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};





// controllers/geocodeController.js



export const cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized action",
      });
    }

    if (!["pending", "accepted"].includes(ride.status)) {
      return res.status(400).json({
        success: false,
        message: "Ride cannot be cancelled at this stage",
      });
    }

    ride.status = "cancelled";
    await ride.save();

    // SOCKET Notify Driver
    if (global.io) {
      global.io
        .to(ride.driver.toString())
        .emit("rideCancelled", { rideId: ride._id });
    }

    res.status(200).json({
      success: true,
      message: "Ride cancelled successfully",
      data: ride,
    });
  } catch (error) {
    console.error("❌ cancelRide error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4️⃣ Ride History
export const getRideHistory = async (req, res) => {
  try {
    const rides = await Ride.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("driver", "name phoneNumber");

    res.status(200).json({
      success: true,
      data: rides,
    });
  } catch (error) {
    console.error("❌ getRideHistory error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const getRideDetails = async (req, res) => {
  try {

    const ride = await Ride.findById(req.params.rideId)

      .populate("driver", "name phoneNumber role")

      .populate("user", "name phoneNumber");


    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }


    res.status(200).json({

      success: true,

      ride: {

        rideId: ride._id,

        driver: ride.driver,

        user: ride.user,

        pickupLocation: ride.pickupLocation,

        dropoffLocation: ride.dropoffLocation,

        fare: ride.fare,

        status: ride.status,

        paymentStatus: ride.paymentStatus,

        createdAt: ride.createdAt

      }

    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};