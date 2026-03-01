import User from "../models/userModel.js";
import Ride from "../models/Ride.js";

// ===================== Controllers =====================

// Get Driver Profile

export const getDriverProfile = async (req, res) => {
  try {
    const driver = await User.findOne({
      _id: req.user.id,
      role: "driver",
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Toggle Online Status

export const getDriverDashboard = async (req, res) => {
  try {
    const driverId = req.user.id;

    const todayRides = await Ride.countDocuments({
      driver: driverId,
      status: "completed",
      createdAt: {
        $gte: new Date().setHours(0, 0, 0, 0),
      },
    });

    const todayEarnings = await Ride.aggregate([
      {
        $match: {
          driver: driverId,
          status: "completed",
          createdAt: {
            $gte: new Date().setHours(0, 0, 0, 0),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$fare" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        todayRides,
        todayEarnings: todayEarnings[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};




export const acceptRide = async (req, res) => {
  try {
    const driverId = req.user.id;

    const rideId = req.params.rideId;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(400).json({
        success: false,
        message: "Ride cannot be accepted",
      });
    }

    // pending होना चाहिए

    if (ride.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Ride not pending",
      });
    }

    // Driver match होना चाहिए

    if (ride.driver.toString() !== driverId) {
      return res.status(400).json({
        success: false,
        message: "Not your ride",
      });
    }

    ride.status = "accepted";

    ride.driver = driverId;

    await ride.save();

    await ride.populate("user", "name phoneNumber");

    // SOCKET

    if (global.io) {
      global.io.to(ride.user._id.toString()).emit("rideAccepted", {
        rideId: ride._id,

        driverId,
      });
    }

    res.status(200).json({
      success: true,

      message: "Ride accepted",

      data: ride,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// Reject Ride

export const rejectRide = async (req, res) => {
  try {
    const driverId = req.user.id;

    const rideId = req.params.rideId;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(400).json({
        success: false,
        message: "Ride cannot be rejected",
      });
    }

    if (ride.status !== "pending" || ride.driver?.toString() !== driverId) {
      return res.status(400).json({
        success: false,
        message: "Ride cannot be rejected",
      });
    }

    ride.status = "rejected";

    ride.driver = null;

    await ride.save();

    await ride.populate("user", "name phoneNumber");

    // SOCKET

    if (global.io) {
      global.io.to(ride.user._id.toString()).emit("rideRejected", {
        rideId: ride._id,
      });
    }

    res.status(200).json({
      success: true,

      message: "Ride rejected",

      data: ride,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// Driver Ride History

export const getDriverRideHistory = async (req, res) => {
  try {
    const rides = await Ride.find({
      driver: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("user", "name phoneNumber");

    res.status(200).json({
      success: true,

      results: rides.length,

      data: rides,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};
