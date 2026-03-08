// adminController.js
import User from "../models/user.model.js";
import Ride from "../models/ride.model.js";
import ApiError from "../utils/ApiError.js";

// ===== Service logic included in same file =====

// 1️⃣ View All Users
const getAllUsersService = async () => {
  return User.find({ role: "user" }).select("-password");
};

// 2️⃣ View All Drivers
const getAllDriversService = async () => {
  return User.find({ role: "driver" }).select("-password");
};

// 3️⃣ Block / Unblock User
const toggleBlockUserService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  user.isActive = !user.isActive;
  await user.save();
  return user;
};

// 4️⃣ Ride Analytics
const getRideAnalyticsService = async () => {
  const totalRides = await Ride.countDocuments();
  const completedRides = await Ride.countDocuments({ status: "completed" });
  const cancelledRides = await Ride.countDocuments({ status: "cancelled" });

  const totalRevenueData = await Ride.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: null, totalRevenue: { $sum: "$fare" } } },
  ]);

  const totalRevenue =
    totalRevenueData.length > 0 ? totalRevenueData[0].totalRevenue : 0;

  return { totalRides, completedRides, cancelledRides, totalRevenue };
};

// ===== Controller functions using service logic =====

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await getAllUsersService();
    res.status(200).json({
      success: true,
      results: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await getAllDriversService();
    res.status(200).json({
      success: true,
      results: drivers.length,
      data: drivers,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await toggleBlockUserService(req.params.userId);
    res.status(200).json({
      success: true,
      message: `User is now ${user.isActive ? "Unblocked" : "Blocked"}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getRideAnalytics = async (req, res, next) => {
  try {
    const analytics = await getRideAnalyticsService();
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};